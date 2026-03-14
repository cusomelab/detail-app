import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedCopy, ProductCategory } from "../types";

// Models mapping
const TEXT_MODEL = 'gemini-2.5-flash'; 
const IMAGE_MODEL = 'gemini-3-pro-image-preview'; 

export type ImageProcessMode = 'MAGIC_FIX' | 'MODEL_SWAP' | 'BG_CHANGE';

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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
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
 * Generates the localized copywriting for the product page.
 */
export const generateProductCopy = async (
  productName: string,
  features: string,
  category: ProductCategory,
  benchmarkUrl?: string,
  mainImage?: File | null
): Promise<GeneratedCopy> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
    Task: Create a high-converting product detail page copy based on the product name, features, AND the provided product image (if available).
    
    ${categoryInstruction}
    
    CRITICAL FORMATTING RULES:
    1. **Product Name**: Use the EXACT provided Product Name in the Main Hook if possible. Do NOT invent a completely unrelated abstract title.
    2. **Natural Flow**: Write complete, flowing sentences spanning 2-3 lines. Do NOT use short, choppy fragments.
    3. **Line Breaks**: Use '\\n' to visually separate parts of the sentence for mobile readability.
    4. **No Punctuation**: Do NOT use commas (,) or periods (.) at the end of lines or in the middle if it breaks the flow visually. Just use line breaks.
    
    Example Good: 
    "피부에 닿는 순간 기분 좋은 부드러움\\n하루 종일 입고 싶어질 거예요"

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
      mainHook: { type: Type.STRING, description: "Catchy headline with \\n line breaks. " },
      sellingPoints: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            icon: { type: Type.STRING, description: "Single emoji" },
            title: { type: Type.STRING, description: "Short title" },
            description: { type: Type.STRING, description: "Natural description spanning 2-3 lines with \\n." },
          }
        }
      },
      story: { type: Type.STRING, description: "Story with \\n line breaks." },
      sizeTip: { type: Type.STRING, description: "Size or Usage tip" },
      mdComment: { type: Type.STRING, description: "MD Comment with \\n line breaks." },
      productInfo: {
        type: Type.OBJECT,
        properties: {
          material: { type: Type.STRING, description: "Material or Ingredients" },
          origin: { type: Type.STRING },
          wash: { type: Type.STRING, description: "Wash or Storage guide" }
        }
      }
    },
    required: ["mainHook", "sellingPoints", "story", "sizeTip", "mdComment", "productInfo"]
  };
  
  const contentPrompt = `
  Product Name: ${productName}
  Category: ${category}
  Key Features: ${features || 'Analyze based on typical items in this category'}
  ${benchmarkContext ? `\n[COMPETITOR BENCHMARK INSIGHTS] (Incorporate these winning points): ${benchmarkContext}` : ''}
  
  IMPORTANT: If an image is provided, VISUALLY ANALYZE it to extract specific details (color, texture, design elements, packaging) and include them in the copy to make it more authentic.
  
  Imagine specific usage scenarios (e.g., "Wearing this at a Hannam-dong cafe", "Camping weekend") rather than generic utility.
  Avoid generic clichés (e.g., "후회 없는", "강력 추천").
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
      setTimeout(() => {
          reject(new Error("Text generation timed out (30s). Please try again."));
      }, 30000);
  });

  const response = await Promise.race([apiCall, timeoutPromise]);

  if (response.text) {
    return JSON.parse(response.text) as GeneratedCopy;
  }
  throw new Error("Failed to generate copy");
};

export const regenerateCopy = async (
  currentText: string,
  fieldLabel: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

  const apiCall = ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: {
      parts: [{ inlineData: { mimeType: imageFile.type, data: base64Data } }, { text: prompt }]
    },
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => { reject(new Error("Image processing timed out.")); }, 45000);
  });

  const response = await Promise.race([apiCall, timeoutPromise]);
  // @ts-ignore
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) throw new Error("No image generated");

  for (const part of candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("No image data found");
};