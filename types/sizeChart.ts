
export interface SizeChartData {
  title: string;
  headers: string[];
  rows: string[][];
  notes: string[];
  productCode?: string;
  weight?: string;
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  EDITING = 'EDITING',
  ERROR = 'ERROR'
}
