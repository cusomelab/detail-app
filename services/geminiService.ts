import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedCopy, ProductCategory, PlanSection } from "../types";

// ── 모델 ───────────────────────────────────────────────
const TEXT_MODEL  = 'gemini-3-flash-preview';
const IMAGE_MODEL = 'gemini-3.1-flash-image-preview';

export type ImageProcessMode = 'MAGIC_FIX' | 'MODEL_SWAP' | 'BG_CHANGE' | 'REMOVE_TEXT' | 'ERASE_PART' | 'CUSTOM';

// ── API 키 전역 관리 ──────────────────────────────────
let _apiKey = '';
export const setApiKey = (key: string) => { _apiKey = key; };
export const getApiKey = () => _apiKey;
const getAI = () => {
  if (!_apiKey) throw new Error('API 키가 설정되지 않았습니다.');
  return new GoogleGenAI({ apiKey: _apiKey });
};

// ── 유틸 ──────────────────────────────────────────────
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = (reader.result as string).split(',')[1];
      resolve(b64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const cleanTextResponse = (data: any): any => {
  if (typeof data === 'string') return data.trim().replace(/\.(?=$|\s)/g, '');
  if (Array.isArray(data)) return data.map(cleanTextResponse);
  if (typeof data === 'object' && data !== null) {
    const cleaned: any = {};
    for (const key in data) cleaned[key] = cleanTextResponse(data[key]);
    return cleaned;
  }
  return data;
};

// ── 카테고리별 프롬프트 ───────────────────────────────
function getCategoryInstruction(category: ProductCategory) {
  switch (category) {
    case 'FASHION': return `
      타겟: 트렌디한 패션 쇼핑객
      톤: 감성적, 부드럽고 친근한
      포커스: 핏, 원단 질감, 무드, 데일리 코디
      키워드: 데일리룩, 소장가치, 핏보장, 감성무드, 세련된, 모던시크
      금지: 촌스러운 표현, 과한 이모티콘`;
    case 'LIVING': return `
      타겟: 주부, 1인가구
      톤: 신뢰감, 실용적, 따뜻한
      포커스: 인테리어 조화, 내구성, 수납, 편리함
      키워드: 감성인테리어, 공간활용, 튼튼한, 삶의질상승`;
    case 'KITCHEN': return `
      타겟: 요리하는 주부, 부모님
      톤: 전문적, 안전한, 깔끔한
      포커스: 위생(소재), 안전성, 요리결과, 간편세척
      키워드: 안심소재, 간편세척, 요리똥손탈출, 위생적인`;
    case 'FOOD': return `
      타겟: 식욕자극, 푸디
      톤: 식욕자극, 활기찬, 신선한
      포커스: 맛 묘사, 신선도, 식감, 재료, HACCP
      키워드: 겉바속촉, 단짠단짠, 신선함, 입맛돋는, 중독성`;
  }
}

// ════════════════════════════════════════════════════
// 1. 기획안 생성 (후커블 스타일 - 13개 섹션)
// ════════════════════════════════════════════════════
export const generatePlan = async (
  productName: string,
  category: ProductCategory,
  features: string,
  mainImage?: File | null
): Promise<PlanSection[]> => {
  const ai = getAI();

  const categoryLabel: Record<ProductCategory, string> = {
    FASHION: '의류/패션', LIVING: '리빙/인테리어', KITCHEN: '주방/식기', FOOD: '식품/건강'
  };

  const systemPrompt = `당신은 한국 최고의 이커머스 상세페이지 기획자입니다.
상품 정보를 분석하여 쿠팡 로켓배송에 최적화된 상세페이지 기획안을 작성합니다.

카테고리: ${categoryLabel[category]}
${getCategoryInstruction(category)}

반드시 JSON 배열로만 응답하세요. 다른 텍스트 없이.
각 섹션은 type, label, title, content 필드를 가집니다.`;

  const userPrompt = `상품명: ${productName}
카테고리: ${categoryLabel[category]}
특징: ${features || '이미지를 분석하여 특징 파악'}

아래 섹션들로 구성된 기획안을 JSON 배열로 작성하세요:

1. HERO - 메인 히어로 (강렬한 첫 인상, 핵심 카피 한 줄)
2. OVERVIEW - 제품 상세 정보 (상품명, 소재, 사이즈, 주요 특징 요약)
3. STORY - 감성 스토리 (일상 속 사용 시나리오, 감성적 표현)
4. DETAIL - 비주얼 클로즈업 (소재/디테일 확대 이미지 설명)
5. REVIEW - 고객 후기 (만족도 4.9/5.0, 실제 구매자 후기 3개)
6. POINT - 셀링포인트1 (첫 번째 핵심 기능/특징)
7. POINT - 셀링포인트2 (두 번째 핵심 기능/특징)
8. POINT - 셀링포인트3 (세 번째 핵심 기능/특징)
9. OPTIONS - 컬러/옵션 (색상별 옵션 안내)
10. RECOMMEND - 추천 대상 (이런 분들께 추천, 5가지)
11. SIZE - 사이즈/제품 정보 (모델 착용 정보, 사이즈 가이드)
12. GUIDE - 제품 가이드 (세탁법/사용법/보관법)
13. INFO - 구매 전 확인사항 (교환/환불 정책, 제조사, 원산지)

각 섹션의 title은 한국어로, content는 구체적인 마케팅 문구로 작성하세요.
JSON 배열 형식: [{"type":"HERO","label":"히어로","title":"...","content":"..."},...]`;

  const requestContents: any[] = [{ text: userPrompt }];
  if (mainImage) {
    const base64Data = await fileToGenerativePart(mainImage);
    requestContents.unshift({ inlineData: { mimeType: mainImage.type, data: base64Data } });
  }

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: requestContents,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      maxOutputTokens: 4096,
    }
  });

  let raw = response.text?.trim() || '[]';
  if (raw.startsWith('```')) {
    raw = raw.split('```')[1];
    if (raw.startsWith('json')) raw = raw.slice(4);
    raw = raw.trim();
  }

  const sections: Omit<PlanSection, 'id' | 'enabled'>[] = JSON.parse(raw);
  return sections.map((s, i) => ({
    ...s,
    id: `section-${i}-${Date.now()}`,
    enabled: true,
  }));
};

// ── 섹션 재생성 ───────────────────────────────────────
export const regeneratePlanSection = async (
  section: PlanSection,
  productName: string,
  category: ProductCategory
): Promise<PlanSection> => {
  const ai = getAI();
  const prompt = `쿠팡 상세페이지의 "${section.label}" 섹션을 다시 작성해주세요.
상품명: ${productName}
카테고리: ${category}
현재 내용: ${section.content}

더 매력적이고 구매욕구를 높이는 내용으로 개선해주세요.
JSON으로만 응답: {"title":"...","content":"..."}`;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });

  let raw = response.text?.trim() || '{}';
  if (raw.startsWith('```')) {
    raw = raw.split('```')[1];
    if (raw.startsWith('json')) raw = raw.slice(4);
    raw = raw.trim();
  }
  const updated = JSON.parse(raw);
  return { ...section, title: updated.title || section.title, content: updated.content || section.content };
};

// ════════════════════════════════════════════════════
// 2. 카피 생성 (기획안 기반)
// ════════════════════════════════════════════════════
export const generateProductCopy = async (
  productName: string,
  features: string,
  category: ProductCategory,
  benchmarkUrl?: string,
  mainImage?: File | null,
  planSections?: PlanSection[]
): Promise<GeneratedCopy> => {
  const ai = getAI();

  const planContext = planSections
    ? planSections.filter(s => s.enabled).map(s => `[${s.label}] ${s.title}: ${s.content}`).join('\n')
    : '';

  const systemInstruction = `당신은 한국 1위 이커머스 카피라이터입니다.
카테고리: ${category}
${getCategoryInstruction(category)}

규칙:
1. 마침표(.)로 끝내지 마세요
2. 줄바꿈은 \\n으로 의미 단위로
3. 단어 중간에 줄바꿈 금지
4. 감성적이고 구매욕구를 높이는 문장`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      mainHook: { type: Type.STRING },
      sellingPoints: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            icon: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
          }
        }
      },
      story: { type: Type.STRING },
      sizeTip: { type: Type.STRING },
      mdComment: { type: Type.STRING },
      productInfo: {
        type: Type.OBJECT,
        properties: {
          material: { type: Type.STRING },
          origin: { type: Type.STRING },
          wash: { type: Type.STRING },
          caution: { type: Type.STRING }
        }
      }
    },
    required: ['mainHook', 'sellingPoints', 'story', 'sizeTip', 'mdComment', 'productInfo']
  };

  const contentPrompt = `
상품명: ${productName}
카테고리: ${category}
특징: ${features || '이미지 분석 후 특징 추출'}
${planContext ? `\n[기획안 기반으로 작성]\n${planContext}` : ''}`;

  const requestContents: any[] = [{ text: contentPrompt }];
  if (mainImage) {
    const b64 = await fileToGenerativePart(mainImage);
    requestContents.unshift({ inlineData: { mimeType: mainImage.type, data: b64 } });
  }

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: requestContents,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: schema,
      maxOutputTokens: 4096,
      temperature: 0.95,
    }
  });

  if (response.text) {
    return cleanTextResponse(JSON.parse(response.text)) as GeneratedCopy;
  }
  throw new Error('카피 생성 실패');
};

// ── 카피 재생성 ───────────────────────────────────────
export const regenerateCopy = async (currentText: string, fieldLabel: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: `한국 이커머스 "${fieldLabel}" 문구를 더 매력적으로 재작성해주세요.
규칙: 마침표 없이, \\n으로 줄바꿈, 단어 중간 줄바꿈 금지.
현재: "${currentText}"`,
    config: { temperature: 0.85 }
  });
  let text = response.text?.trim() || currentText;
  if (text.endsWith('.')) text = text.slice(0, -1);
  return text;
};

// ── 이미지 처리 ───────────────────────────────────────
export const processProductImage = async (
  imageFile: File,
  mode: ImageProcessMode,
  maskFile?: File,
  customPrompt?: string
): Promise<string> => {
  const ai = getAI();
  const base64Data = await fileToGenerativePart(imageFile);
  let prompt = '';
  const parts: any[] = [{ inlineData: { mimeType: imageFile.type, data: base64Data } }];

  if (mode === 'ERASE_PART' && maskFile) {
    const maskB64 = await fileToGenerativePart(maskFile);
    parts.push({ inlineData: { mimeType: 'image/png', data: maskB64 } });
    prompt = 'Inpaint the masked area naturally.';
  } else if (mode === 'CUSTOM' && customPrompt) {
    prompt = customPrompt;
  } else {
    switch (mode) {
      case 'MAGIC_FIX':    prompt = 'Remove all Chinese/foreign text and watermarks. Improve image quality for Korean e-commerce.'; break;
      case 'MODEL_SWAP':   prompt = 'Replace the model with a trendy Korean model. Keep the product exactly the same.'; break;
      case 'BG_CHANGE':    prompt = 'Change background to a clean minimal studio. Keep the product exactly the same.'; break;
      case 'REMOVE_TEXT':  prompt = 'Remove all foreign text/watermarks from this image. Inpaint naturally.'; break;
    }
  }
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: { parts },
    config: { responseModalities: ['TEXT', 'IMAGE'] }
  });

  // @ts-ignore
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error('이미지 생성 실패');
};
