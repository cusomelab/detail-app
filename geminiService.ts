
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedCopy, ProductCategory } from "../types";

// Models mapping
const TEXT_MODEL = 'gemini-3-flash-preview'; 
const IMAGE_MODEL = 'gemini-3-pro-image-preview'; 

export type ImageProcessMode = 'MAGIC_FIX' | 'MODEL_SWAP' | 'BG_CHANGE' | 'REMOVE_TEXT' | 'ERASE_PART' | 'CUSTOM';

// ★ API Key 가져오기
const getApiKey = (): string => {
    // 1) 런타임 수동 입력
    const runtimeKey = (window as any)?.__GEMINI_API_KEY__;
    if (runtimeKey && typeof runtimeKey === 'string' && runtimeKey.length > 10) return runtimeKey;
    // 2) Vite 빌드 시 주입
    try {
        const envKey = process.env.API_KEY;
        if (envKey && typeof envKey === 'string' && envKey !== 'PLACEHOLDER_API_KEY' && envKey.length > 10) return envKey;
    } catch {}
    // 3) Gemini API Key 환경변수 직접 참조
    try {
        const geminiKey = process.env.GEMINI_API_KEY;
        if (geminiKey && typeof geminiKey === 'string' && geminiKey !== 'PLACEHOLDER_API_KEY' && geminiKey.length > 10) return geminiKey;
    } catch {}
    throw new Error('API 키가 설정되지 않았습니다. 앱을 새로고침하고 API Key를 입력해주세요.');
};

/**
 * Converts a File object to a Base64 string suitable for Gemini API.
 */
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Analyzes a benchmark URL using Google Search Grounding to extract key selling points.
 */
async function analyzeBenchmarkUrl(url: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are a market researcher. Analyze the product at this URL: ${url}.
            Find:
            1. Key Selling Points (Why do people buy it?)
            2. Any unique marketing copy style or keywords used.
            3. Overall mood.
            
            Return a summary in Korean.`,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        return response.text || "";
    } catch (error) {
        console.warn("Benchmarking failed:", error);
        return "";
    }
}

/**
 * Recursively removes trailing periods from string values in an object.
 */
const cleanTextResponse = (data: any): any => {
    if (typeof data === 'string') {
        // Remove trailing period if it exists, but keep exclamation/question marks
        return data.trim().replace(/\.(?=$|\s)/g, ""); 
    }
    if (Array.isArray(data)) {
        return data.map(cleanTextResponse);
    }
    if (typeof data === 'object' && data !== null) {
        const cleaned: any = {};
        for (const key in data) {
            cleaned[key] = cleanTextResponse(data[key]);
        }
        return cleaned;
    }
    return data;
};

/**
 * Generates the localized copywriting for the product page.
 */
export const generateProductCopy = async (
  productName: string,
  features: string,
  category: ProductCategory,
  benchmarkUrl?: string,
  mainImage?: File | null
): Promise<GeneratedCopy> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  let benchmarkContext = "";
  if (benchmarkUrl) {
      benchmarkContext = await analyzeBenchmarkUrl(benchmarkUrl);
  }

  // Dynamic Persona based on Category
  let categoryInstruction = "";
  switch (category) {
      case 'FASHION':
          categoryInstruction = `
            Target: Trendy fashion shoppers.
            Tone: Emotional, Sensual, Soft, Friendly.
            Focus: Fit, Fabric texture, Mood, Daily coordination.
            Keywords: 데일리룩, 소장가치, 핏보장, 감성무드, 세련된, 모던시크.
            Avoid: 촌스러운 표현, 과한 이모티콘, 꾸안꾸, 여리여리.
          `;
          break;
      case 'LIVING':
          categoryInstruction = `
            Target: Homemakers, 1-person households.
            Tone: Trustworthy, Practical, Warm, Polite.
            Focus: Interior harmony, Durability, Organization, Convenience.
            Keywords: 감성인테리어, 공간활용, 튼튼한, 삶의질상승.
          `;
          break;
      case 'KITCHEN':
          categoryInstruction = `
            Target: Home cooks, Parents.
            Tone: Professional, Safe, Clean, Reliable.
            Focus: Hygiene (Materials), Safety, Cooking results (Taste), Easy cleaning.
            Keywords: 안심소재, 간편세척, 요리똥손탈출, 위생적인.
          `;
          break;
      case 'FOOD':
          categoryInstruction = `
            Target: Hungry shoppers, Foodies.
            Tone: Appetizing, Energetic, Fresh, Sizzling.
            Focus: Taste description, Freshness, Texture, Ingredients, HACCP.
            Keywords: 겉바속촉, 단짠단짠, 신선함, 입맛돋는, 중독성.
          `;
          break;
  }

  const systemInstruction = `
    Role: You are Korea's #1 E-commerce Copywriter for ${category} category.
    Task: Create a high-converting product detail page copy.
    
    ${categoryInstruction}
    
    CRITICAL FORMATTING RULES:
    1. **NO PERIODS**: Do NOT end headlines, titles, or short sentences with a period (.). Use natural endings.
    2. **Line Breaks**: Break lines (\\n) ONLY at the end of meaningful phrases or semantic units (Eojeol). 
    3. **Avoid Word Splitting**: Never break a line in the middle of a word or between a noun and its particle.
    4. **Visual Balance**: Aim for 2-3 lines per section.
    
    Structure:
    1. Main Hook: Catchy title using the Product Name.
    2. Selling Points: 3 key features. Title and natural 2-3 line phrase-based descriptions.
    3. Story: Emotional/Practical story. 2-3 lines.
    4. Size Tip: Advice relevant to the category.
    5. MD Comment: A friendly recommendation.
    6. Product Info: Material, Origin, Wash/Caution.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      mainHook: { type: Type.STRING, description: "Headline with semantic \\n line breaks. NO trailing periods." },
      sellingPoints: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            icon: { type: Type.STRING },
            title: { type: Type.STRING, description: "NO trailing periods." },
            description: { type: Type.STRING, description: "Description with semantic \\n line breaks. NO trailing periods." },
          }
        }
      },
      story: { type: Type.STRING, description: "Story with semantic \\n line breaks. NO trailing periods." },
      sizeTip: { type: Type.STRING },
      mdComment: { type: Type.STRING, description: "MD Comment with semantic \\n line breaks." },
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
    required: ["mainHook", "sellingPoints", "story", "sizeTip", "mdComment", "productInfo"]
  };
  
  const contentPrompt = `
  Product Name: ${productName}
  Category: ${category}
  Key Features: ${features || 'Analyze based on typical items in this category'}
  ${benchmarkContext ? `\n[COMPETITOR BENCHMARK INSIGHTS]: ${benchmarkContext}` : ''}
  `;

  const requestContents: any[] = [{ text: contentPrompt }];
  if (mainImage) {
      const base64Data = await fileToGenerativePart(mainImage);
      requestContents.unshift({
          inlineData: {
              mimeType: mainImage.type,
              data: base64Data
          }
      });
  }

  const apiCall = ai.models.generateContent({
    model: TEXT_MODEL,
    contents: requestContents,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.95
    }
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => { reject(new Error("Text generation timed out.")); }, 30000);
  });

  const response = await Promise.race([apiCall, timeoutPromise]);
  if (response.text) {
      const rawData = JSON.parse(response.text);
      return cleanTextResponse(rawData) as GeneratedCopy;
  }
  throw new Error("Failed to generate copy");
};

export const regenerateCopy = async (
  currentText: string,
  fieldLabel: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const prompt = `You are a Korean e-commerce copywriter. Rewrite the text below into ONE short, polished version.

ABSOLUTE RULES:
- Return ONLY the rewritten text. Nothing else.
- Do NOT provide multiple options or alternatives.
- Do NOT include any explanation, intro, or preamble like "요청하신 규칙에 맞춰" or "제안해 드립니다".
- Do NOT use markdown: no **, no *, no #, no - lists, no numbered lists, no backticks, no --- dividers.
- Do NOT add labels like "옵션 1." or "[MD's Pick]".
- No trailing periods.
- Keep it concise - similar length or shorter than the original.
- Use natural line breaks (\\n) at semantic boundaries only.
- Professional, emotional Korean tone.

Text to rewrite:
${currentText}`;
  const response = await ai.models.generateContent({
    model: TEXT_MODEL, 
    contents: prompt,
    config: { temperature: 0.8 }
  });
  let text = response.text?.trim() || currentText;
  // 마크다운/번호/서론 잔여물 후처리
  text = text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/^[-*•]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^---+$/gm, '')
    .replace(/\\n/g, '\n')
    .replace(/^\s*\[?옵션\s*\d+\.?\]?\s*/gm, '')
    .replace(/^\s*\(추천\)\s*/gm, '')
    .replace(/^\s*\[MD'?s?\s*Pick\]\s*/gim, '')
    .replace(/요청하신.*?제안해\s*드립니다\.?\s*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (text.endsWith('.')) text = text.slice(0, -1);
  return text;
};

export const processProductImage = async (
  imageFile: File,
  mode: ImageProcessMode,
  maskFile?: File,
  customPrompt?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const base64Data = await fileToGenerativePart(imageFile);
  let prompt = "";
  const parts: any[] = [{ inlineData: { mimeType: imageFile.type, data: base64Data } }];
  if (mode === 'ERASE_PART' && maskFile) {
      const maskBase64 = await fileToGenerativePart(maskFile);
      parts.push({ inlineData: { mimeType: 'image/png', data: maskBase64 } });
      prompt = `Inpaint the masked area.`;
  } else if (mode === 'CUSTOM' && customPrompt) {
      prompt = customPrompt;
  } else {
    switch (mode) {
        case 'MAGIC_FIX': prompt = `Improve quality, remove text.`; break;
        case 'MODEL_SWAP': prompt = `Replace with Korean model.`; break;
        case 'BG_CHANGE': prompt = `Change to studio background.`; break;
        case 'REMOVE_TEXT': prompt = `Remove foreign text.`; break;
    }
  }
  parts.push({ text: prompt });
  const apiCall = ai.models.generateContent({ model: IMAGE_MODEL, contents: { parts: parts } });
  const response = await apiCall;
  // @ts-ignore
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("No image data found");
};
