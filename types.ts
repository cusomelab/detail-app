import type { SectionVariantSet } from './presets/layoutPresets';

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

// ── 정보고시 ───────────────────────────────────────────
export interface ProductInfoDisclosure {
  // 공통
  manufacturer: string;       // 제조자/수입자
  origin: string;             // 원산지
  customerService: string;    // 고객센터
  // 의류/패션
  material?: string;          // 소재
  size?: string;              // 사이즈
  color?: string;             // 색상
  wash?: string;              // 세탁방법
  // 식품
  ingredients?: string;       // 원재료
  capacity?: string;          // 용량/중량
  expiry?: string;            // 유통기한
  storage?: string;           // 보관방법
  haccp?: string;             // 인증여부
  // 리빙/주방
  certifications?: string;    // 인증/허가
  warranty?: string;          // 품질보증
  caution?: string;           // 주의사항
}

// ── 기획안 섹션 ───────────────────────────────────────
export interface PlanSection {
  id: string;
  type: 'HERO' | 'OVERVIEW' | 'STORY' | 'DETAIL' | 'REVIEW' | 'POINT' | 'OPTIONS' | 'RECOMMEND' | 'SIZE' | 'GUIDE' | 'INFO' | 'CAUTION' | 'CUSTOM';
  label: string;       // 표시 이름 (예: 헤로, 제품 상세정보)
  title: string;       // 섹션 제목
  content: string;     // 섹션 설명/내용
  enabled: boolean;    // 포함 여부
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
    caution?: string;
  };
  detailCopies?: string[];
  // Step 2: LLM-selected layout variants per section (optional, not yet rendered)
  sectionVariants?: SectionVariantSet;
}

export interface ProcessedImage {
  originalUrl: string;
  processedUrl: string | null;
  type: 'main' | 'detail' | 'option' | 'styled';
  status: 'pending' | 'processing' | 'done' | 'error';
  fileName?: string;
  label?: string; // AI 연출 샷 라벨 (예: "착용 연출", "디테일 클로즈업")
}

export enum AppStep {
  INPUT = 'INPUT',
  PLAN = 'PLAN',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT'
}
