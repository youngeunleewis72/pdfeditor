export interface PageInfo {
  page_number: number;
  rotation: number;
  width: number;
  height: number;
}

export interface PdfDocumentInfo {
  file_name: string;
  file_path: string;
  file_size: number;
  page_count: number;
  pages: PageInfo[];
}

export interface ExportPageConfig {
  original_page: number;
  rotation: number;
}

export interface PageItem {
  id: string;
  originalPage: number;
  rotation: number; // 0, 90, 180, 270
  thumbnailUrl: string;
  width: number;
  height: number;
}
