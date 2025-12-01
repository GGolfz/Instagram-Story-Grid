export interface GridImage {
  id: string;
  file: File;
  preview: string;
  zoom: number;
  panX: number;
  panY: number;
}

export interface GridConfig {
  columns: number;
  rows: number;
}

