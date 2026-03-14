
export interface ImageItem {
  id: string;
  sourceUrl: string;
  originalFileName: string; // 원본 파일 이름 저장
  mimeType: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  resultUrl?: string;
  error?: string;
  feedback?: string;
  selectedScene: StudioScene;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export enum StudioScene {
  MINIMALIST = "미니멀 대리석",
  LIFESTYLE_KITCHEN = "현대식 주방 조리대",
  LIFESTYLE_LIVING = "포근한 거실",
  PROFESSIONAL_STUDIO = "전문 스튜디오",
  NATURE_OUTDOOR = "자연광 야외",
  DARK_LUXURY = "다크 럭셔리"
}

export const SCENE_PROMPTS: Record<StudioScene, string> = {
  [StudioScene.MINIMALIST]: "on a clean white marble surface with soft natural lighting and minimalist background",
  [StudioScene.LIFESTYLE_KITCHEN]: "on a clean modern kitchen counter with blurred kitchen interior in the background",
  [StudioScene.LIFESTYLE_LIVING]: "placed on a wooden coffee table in a warm, cozy living room with soft bokeh",
  [StudioScene.PROFESSIONAL_STUDIO]: "as a professional studio product photograph with softbox lighting and a solid neutral gradient background",
  [StudioScene.NATURE_OUTDOOR]: "outdoors on a rustic stone surface surrounded by soft green foliage and bright morning sunlight",
  [StudioScene.DARK_LUXURY]: "on a dark reflective surface with dramatic low-key spotlighting, luxury aesthetic"
};
