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
  };
}

export interface ProcessedImage {
  originalUrl: string;
  processedUrl: string | null; // Base64 or URL
  type: 'main' | 'detail' | 'option';
  status: 'pending' | 'processing' | 'done' | 'error';
}

export enum AppStep {
  INPUT = 'INPUT',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT'
}