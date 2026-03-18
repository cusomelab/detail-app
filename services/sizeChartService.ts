
import { GoogleGenAI, Type } from "@google/genai";
import { SizeChartData } from "../types/sizeChart";
import { getApiKey } from "./geminiService";

export const analyzeSizeChart = async (base64Image: string): Promise<SizeChartData> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  
  const prompt = `
    Analyze this Chinese size chart image and translate it into Korean.
    Extract the following information:
    1. The title of the chart (usually 尺码表).
    2. Any product code (货号) or weight (重量) info at the top.
    3. The main table headers (e.g., Size, Bust, Waist, Length, etc.). Translate these to standard Korean fashion terms.
       - 尺码 -> 사이즈
       - 胸围 -> 가슴둘레
       - 腰围 -> 허리둘레
       - 臀围 -> 엉덩이둘레
       - 衣长 -> 총장
       - 袖长 -> 소매길이
       - 肩宽 -> 어깨너비
    4. All the data rows in the table. Keep numbers as they are.
    5. Footer notes (e.g., [单位为CM], measurement errors warnings). Translate to Korean.

    Return the result in strictly formatted JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image.split(',')[1] || base64Image
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          productCode: { type: Type.STRING },
          weight: { type: Type.STRING },
          headers: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          rows: {
            type: Type.ARRAY,
            items: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          notes: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["title", "headers", "rows", "notes"]
      }
    }
  });

  try {
    const data: SizeChartData = JSON.parse(response.text);
    return data;
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    throw new Error("AI가 데이터를 분석하는 데 실패했습니다. 이미지 선명도를 확인해주세요.");
  }
};
