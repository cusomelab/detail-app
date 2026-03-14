import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedCopy, ProductCategory } from "../types";

// Models mapping
const TEXT_MODEL = 'gemini-2.0-flash'; 
const IMAGE_MODEL = 'gemini-2.0-flash-exp'; 

export type ImageProcessMode = 'MAGIC_FIX' | 'MODEL_SWAP' | 'BG_CHANGE';

// ── API 키 전역 관리 ──────────────────────────────────
let _apiKey: string = '';
export const setApiKey = (key: string) => { _apiKey = key; };
export const getApiKey = () => _apiKey;

const getAI = () => {
  if (!_apiKey) throw new Error('API 키가 설정되지 않았습니다.');
  return new GoogleGenAI({ apiKey: _apiKey });
};

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

async function analyzeBenchmarkUrl(url: string): Promise<string> {
    const ai = getAI();
    try {
       const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: requestContents,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.95,
      maxOutputTokens: 4096
    }
  });
        return response.text || "";
    } catch (error) {
        console.warn("Benchmarking failed:", error);
        return "";
    }
}

export const generateProductCopy = async (
  productName: string,
  features: string,
  category: ProductCategory,
  benchmarkUrl?: string,
  mainImage?: File | null
): Promise<GeneratedCopy> => {
  const ai = getAI();
  
  let benchmarkContext = "";
  if (benchmarkUrl) {
      benchmarkContext = await analyzeBenchmarkUrl(benchmarkUrl);
  }

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
    Task: Create a high-converting product detail page copy based on the product name, features, AND the provided product image (if available).
    
    ${categoryInstruction}
    
    CRITICAL FORMATTING RULES:
    1. **Product Name**: Use the EXACT provided Product Name in the Main Hook if possible.
    2. **Natural Flow**: Write complete, flowing sentences spanning 2-3 lines.
    3. **Line Breaks**: Use '\\n' to visually separate parts of the sentence for mobile readability.
    4. **No Punctuation**: Do NOT use commas (,) or periods (.) at the end of lines.
    
    Structure:
    1. Main Hook: Catchy title using the Product Name or key benefit.
    2. Selling Points: 3 key features. Titles and natural 2-3 line descriptions.
    3. Story: Emotional/Practical story. 2-3 lines.
    4. Size Tip: Advice relevant to the category.
    5. MD Comment: A friendly recommendation.
    6. Product Info: Material/Ingredients, Origin, Wash/Storage guide.
  `;

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
          wash: { type: Type.STRING }
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
  ${mainImage ? 'IMPORTANT: Analyze the provided image to extract specific details.' : ''}
  Imagine specific usage scenarios. Avoid generic clichés.
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

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: requestContents,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.95
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as GeneratedCopy;
  }
  throw new Error("Failed to generate copy");
};

export const regenerateCopy = async (
  currentText: string,
  fieldLabel: string
): Promise<string> => {
  const ai = getAI();
  const prompt = `Rewrite this '${fieldLabel}' text for a Korean e-commerce page. 
  Rules:
  1. Make it more attractive, emotional, and persuasive.
  2. Use natural, flowing sentences (2-3 lines).
  3. Use line breaks (\\n) for readability.
  4. Avoid commas and periods.
  
  Current: "${currentText}"`;
  const response = await ai.models.generateContent({
    model: TEXT_MODEL, 
    contents: prompt,
    config: { temperature: 0.85 }
  });
  return response.text?.trim() || currentText;
};

export const processProductImage = async (
  imageFile: File,
  mode: ImageProcessMode
): Promise<string> => {
  const ai = getAI();
  const base64Data = await fileToGenerativePart(imageFile);
  
  let prompt = "";
  switch (mode) {
      case 'MAGIC_FIX':
          prompt = `TRANSFORM this e-commerce image for Korean Market. REMOVE ALL text/watermarks. Inpaint background. Improve quality.`;
          break;
      case 'MODEL_SWAP':
          prompt = `Replace the model with a trendy Korean model. Keep the product/clothing exactly the same.`;
          break;
      case 'BG_CHANGE':
          prompt = `Change background to a clean, minimal indoor studio. Keep the product/subject exactly the same.`;
          break;
  }

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: {
      parts: [{ inlineData: { mimeType: imageFile.type, data: base64Data } }, { text: prompt }]
    },
    config: { responseModalities: ['TEXT', 'IMAGE'] }
  });

  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) throw new Error("No image generated");

  for (const part of candidates[0].content.parts) {
    if ((part as any).inlineData) return `data:image/png;base64,${(part as any).inlineData.data}`;
  }
  throw new Error("No image data found");
};
