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

const stripMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/^\s*[-*]\s+/gm, '');
};

const cleanTextResponse = (data: any): any => {
  if (typeof data === 'string') return stripMarkdown(data.trim().replace(/\.(?=$|\s)/g, ''));
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
2. STORY - 감성 스토리 (한 줄로 감성적 표현, 50자 이내)
3. POINT - 셀링포인트1 (첫 번째 핵심 기능/특징, 제목은 짧고 임팩트있게)
4. POINT - 셀링포인트2 (두 번째 핵심 기능/특징)
5. POINT - 셀링포인트3 (세 번째 핵심 기능/특징)
6. REVIEW - 고객 후기 (만족도 4.9/5.0, 실제 구매자 후기 3개를 각각 줄바꿈으로 구분)
7. OPTIONS - 컬러/옵션 (색상별 옵션 안내)
8. RECOMMEND - 추천 대상 (이런 분들께 추천, 5가지를 각각 줄바꿈으로 구분)

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
2. 문장은 반드시 완성된 형태여야 합니다. 절대로 단어 중간에서 끊지 마세요
3. sellingPoints의 description은 2~3문장으로, 한 문장이 한 줄에 완전히 들어가야 합니다
4. 줄바꿈(\\n)은 문장과 문장 사이에만 사용하세요. 절대로 문장 중간, 단어 중간에 줄바꿈하지 마세요
5. 감성적이고 구매욕구를 높이는 자연스러운 문장
6. story는 50자 이내 한 줄로`;

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
규칙: 마침표 없이, \\n으로 줄바꿈, 단어 중간 줄바꿈 금지, 마크다운 서식(**굵게** 등) 절대 사용 금지. 순수 텍스트만 출력.
현재: "${currentText}"`,
    config: { temperature: 0.85 }
  });
  let text = response.text?.trim() || currentText;
  // 마크다운 서식 제거: **bold**, *italic*, __underline__, ~strikethrough~, `code`, # 헤딩
  text = text.replace(/\*\*(.+?)\*\*/g, '$1');   // **bold** → bold
  text = text.replace(/\*(.+?)\*/g, '$1');         // *italic* → italic
  text = text.replace(/__(.+?)__/g, '$1');         // __underline__ → underline
  text = text.replace(/~~(.+?)~~/g, '$1');         // ~~strike~~ → strike
  text = text.replace(/`(.+?)`/g, '$1');           // `code` → code
  text = text.replace(/^#+\s*/gm, '');             // # 헤딩 제거
  text = text.replace(/^\s*[-*]\s+/gm, '');        // - 또는 * 리스트 마커 제거
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

// ════════════════════════════════════════════════════
// AI 연출 샷 자동 생성 (메인 이미지 → 3장 스타일링 이미지)
// ════════════════════════════════════════════════════
export interface StyledShotResult {
  imageUrl: string;
  label: string;
}

// 카테고리별 연출 프롬프트 (3가지 각도)
function getStyledShotPrompts(category: ProductCategory): { prompt: string; label: string }[] {
  switch (category) {
    case 'FASHION':
      return [
        { prompt: 'Generate a full-body fashion photo of a trendy Korean woman wearing this exact clothing item in a clean white studio with soft diffused lighting. Professional editorial fashion photography. Keep the clothing design and color exactly the same.', label: 'studio' },
        { prompt: 'Generate a close-up detail shot focusing on the fabric texture and stitching of this clothing item on a clean white background. Macro photography, soft studio lighting, showing material quality. Keep the clothing design exactly the same.', label: 'detail' },
        { prompt: 'Generate a flat lay styling photo of this clothing item arranged beautifully on a clean white surface with minimal accessories. Top-down view, clean studio lighting, magazine styling. Keep the clothing design and color exactly the same.', label: 'flatlay' },
      ];
    case 'LIVING':
      return [
        { prompt: 'Place this product in a clean, bright Scandinavian-style room with white walls and natural wood furniture. Soft warm studio lighting. Keep the product exactly the same.', label: 'interior' },
        { prompt: 'Generate a close-up detail shot of this product showing material quality and craftsmanship. Clean white background, soft studio lighting, macro photography. Keep the product exactly the same.', label: 'detail' },
        { prompt: 'Show this product being used in a minimalist home setting with a person. Clean studio-like environment with warm lighting. Keep the product exactly the same.', label: 'lifestyle' },
      ];
    case 'KITCHEN':
      return [
        { prompt: 'Place this kitchen product in a beautiful modern kitchen counter setting. Clean white marble, natural sunlight, some fresh ingredients nearby. Keep the product exactly the same.', label: '주방 연출' },
        { prompt: 'Show this kitchen product being used while cooking. Action shot, steam rising, fresh ingredients. Professional food photography lighting. Keep the product exactly the same.', label: '요리 장면' },
        { prompt: 'Generate a clean studio shot of this product on a white background with dramatic lighting. Commercial product photography, showing every detail. Keep the product exactly the same.', label: '스튜디오 촬영' },
      ];
    case 'FOOD':
      return [
        { prompt: 'Style this food product on a beautiful wooden table with complementary dishes and garnishes. Top-down food photography, natural lighting. Keep the food product exactly the same.', label: '푸드 스타일링' },
        { prompt: 'Show this food product in a close-up appetizing shot with steam or fresh texture visible. Macro food photography, warm lighting. Keep the food product exactly the same.', label: '식욕자극 클로즈업' },
        { prompt: 'Show a person enjoying this food product at a cozy cafe or dining table. Natural lifestyle photography, warm atmosphere. Keep the food product exactly the same.', label: '다이닝 연출' },
      ];
  }
}

export const generateStyledShots = async (
  mainImage: File,
  category: ProductCategory,
  onProgress?: (index: number, total: number) => void
): Promise<StyledShotResult[]> => {
  const ai = getAI();
  const base64Data = await fileToGenerativePart(mainImage);
  const prompts = getStyledShotPrompts(category);
  const results: StyledShotResult[] = [];

  for (let i = 0; i < prompts.length; i++) {
    onProgress?.(i + 1, prompts.length);
    try {
      const response = await ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: {
          parts: [
            { inlineData: { mimeType: mainImage.type, data: base64Data } },
            { text: prompts[i].prompt }
          ]
        },
        config: { responseModalities: ['TEXT', 'IMAGE'] }
      });

      // @ts-ignore
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          results.push({
            imageUrl: `data:image/png;base64,${part.inlineData.data}`,
            label: prompts[i].label
          });
          break;
        }
      }
    } catch (err) {
      console.warn(`연출 샷 ${i + 1} 생성 실패:`, err);
      // 실패해도 나머지 계속 진행
    }
  }

  return results;
};
