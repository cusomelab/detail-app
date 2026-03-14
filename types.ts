export type ProductCategory = 'FASHION' | 'LIVING' | 'KITCHEN' | 'FOOD';

export interface ProductData {
  productName: string;
  category: ProductCategory;
  features: string;
  mainImage: File | null;
  detailImages: File[];
  optionImages: File[];
  benchmarkUrl?: string;
}

export interface GeneratedCopy {
  mainHook: string;
  sellingPoints: {
    icon: string;
    title: string;
    description: string;
  }[];
  story: string;
  sizeTip: string;
  mdComment: string;
  productInfo: {
    material: string;
    origin: string;
    wash: string;
    caution?: string; // Added caution field
  };
}

export interface ProcessedImage {
  originalUrl: string;
  processedUrl: string | null; // Base64 or URL
  type: 'main' | 'detail' | 'option';
  status: 'pending' | 'processing' | 'done' | 'error';
  fileName?: string;
}

export enum AppStep {
  INPUT = 'INPUT',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT'
}

// ★ 기획안 섹션 데이터 (13개 섹션 지원)
export interface PlanSection {
  type: string;      // 'HERO' | 'STORY' | 'CLOSEUP' | 'REVIEW' | 'POINT' | 'OPTIONS' | 'RECOMMEND' | 'SIZE' | 'GUIDE' | 'CAUTION' | 'DETAIL' | 'INFO' | 'CUSTOM'
  title: string;     // 섹션 제목
  content: string;   // 섹션 본문 (줄바꿈으로 항목 구분)
  enabled: boolean;  // 활성화 여부
}

// ★ 상품 정보고시 데이터
export interface ProductInfoDisclosure {
  manufacturer?: string;
  origin?: string;
  material?: string;
  size?: string;
  color?: string;
  wash?: string;
  ingredients?: string;
  capacity?: string;
  expiry?: string;
  storage?: string;
  haccp?: string;
  certifications?: string;
  warranty?: string;
  caution?: string;
  customerService?: string;
}
