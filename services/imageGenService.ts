
import { GoogleGenAI } from "@google/genai";
import { StudioScene, SCENE_PROMPTS } from "../types/imageGen";

// ── API 키 전역 참조 (App.tsx에서 setApiKey로 주입)
import { getApiKey } from "./geminiService";

export const generateReimaginedImage = async (
  base64Image: string,
  mimeType: string,
  scene: StudioScene,
  feedback?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  // 1. 제품 식별 및 텍스트 존재 여부 확인 지침 포함
  const analysisResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: "이 이미지에서 주요 제품이 무엇인지 파악하고, 그 제품의 시각적 특징을 5-10단어의 영어로 묘사해주세요. 또한 제품에 중국어 텍스트가 포함되어 있는지 확인해주세요." }
      ]
    }
  });

  const productDescription = analysisResponse.text?.trim() || "the product";
  const sceneDescription = SCENE_PROMPTS[scene];
  
  // 사용자의 피드백 반영
  const feedbackClause = feedback ? ` Apply the following user feedback: "${feedback}".` : "";
  
  // 중국어 제거를 위한 핵심 지침 추가
  const cleanTextInstruction = " Crucially, identify and remove any Chinese characters, text, or logos present on the product surface. Replace them with clean, matching textures or appropriate neutral design elements. Do not change other aspects of the product.";

  const prompt = `Professional product photography of ${productDescription}, ${sceneDescription}. 
  The main product must remain consistent with the source image in terms of shape and material, but placed in this new high-quality setting.${cleanTextInstruction}
  High resolution, 8k, sharp focus, cinematic lighting.${feedbackClause}`;

  // 2. 이미지 생성
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: prompt,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("이미지 데이터를 찾을 수 없습니다.");
};
