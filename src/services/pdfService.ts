import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { ExportPageConfig, PageItem, PdfDocumentInfo } from "../types";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * 네이티브 파일 열기 다이얼로그로 PDF 파일 선택
 */
export async function pickPdfFile(): Promise<string | null> {
  const selected = await open({
    multiple: false,
    filters: [
      {
        name: "PDF Documents",
        extensions: ["pdf"],
      },
    ],
  });

  if (!selected || Array.isArray(selected)) return null;
  return selected;
}

/**
 * 여러 PDF 파일 선택 다이얼로그 (병합용)
 */
export async function pickMultiplePdfFiles(): Promise<string[]> {
  const selected = await open({
    multiple: true,
    filters: [
      {
        name: "PDF Documents",
        extensions: ["pdf"],
      },
    ],
  });

  if (!selected) return [];
  if (Array.isArray(selected)) return selected;
  return [selected];
}

/**
 * PDF 저장 위치 선택 다이얼로그
 */
export async function pickSaveLocation(defaultName: string): Promise<string | null> {
  const selected = await save({
    defaultPath: defaultName,
    filters: [
      {
        name: "PDF Documents",
        extensions: ["pdf"],
      },
    ],
  });

  return selected;
}

/**
 * PDF 파일 메타데이터 가져오기
 */
export async function fetchPdfInfo(filePath: string): Promise<PdfDocumentInfo> {
  return await invoke<PdfDocumentInfo>("get_pdf_info", { path: filePath });
}

/**
 * PDF 파일 바이트를 가져와 PDF.js로 페이지별 썸네일 생성
 */
export async function loadPdfPages(
  filePath: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ pages: PageItem[]; meta: PdfDocumentInfo }> {
  const meta = await fetchPdfInfo(filePath);
  const rawBytes = await invoke<number[]>("read_pdf_bytes", { path: filePath });
  const uint8Array = new Uint8Array(rawBytes);

  const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const pages: PageItem[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    // 썸네일 해상도 계산 (너비 약 250px 기준)
    const baseViewport = page.getViewport({ scale: 1.0 });
    const scale = Math.min(1.0, 260 / baseViewport.width);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // @ts-expect-error pdfjs canvasContext type compatibility
      await page.render({ canvasContext: ctx, viewport }).promise;
      const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.85);

      const existingPageInfo = meta.pages.find((p) => p.page_number === i);
      const initialRotation = existingPageInfo ? existingPageInfo.rotation : 0;

      pages.push({
        id: `page-${i}-${Date.now()}-${Math.random()}`,
        originalPage: i,
        rotation: initialRotation,
        thumbnailUrl,
        width: baseViewport.width,
        height: baseViewport.height,
      });
    }

    if (onProgress) {
      onProgress(i, numPages);
    }
  }

  return { pages, meta };
}

/**
 * 페이지 구성(순서, 회전, 삭제) 적용하여 새 PDF로 저장
 */
export async function exportPdfFile(
  sourcePath: string,
  targetPath: string,
  pages: PageItem[]
): Promise<void> {
  const configs: ExportPageConfig[] = pages.map((p) => ({
    original_page: p.originalPage,
    rotation: p.rotation,
  }));

  await invoke("export_pdf", {
    sourcePath,
    targetPath,
    pages: configs,
  });
}

/**
 * 여러 PDF 파일 병합
 */
export async function mergePdfFiles(sourcePaths: string[], targetPath: string): Promise<void> {
  await invoke("merge_pdfs", {
    sourcePaths,
    targetPath,
  });
}

/**
 * 단일 PDF 분할
 */
export async function splitPdfFile(
  sourcePath: string,
  outputDir: string,
  baseName: string
): Promise<string[]> {
  return await invoke<string[]>("split_pdf", {
    sourcePath,
    outputDir,
    baseName,
  });
}
