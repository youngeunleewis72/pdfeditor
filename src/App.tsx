import { useState } from "react";
import { Navbar } from "./components/Navbar";
import { Toolbar } from "./components/Toolbar";
import { PageCard } from "./components/PageCard";
import { MergeModal } from "./components/MergeModal";
import { PreviewModal } from "./components/PreviewModal";
import { PageItem, PdfDocumentInfo } from "./types";
import {
  pickPdfFile,
  pickSaveLocation,
  loadPdfPages,
  exportPdfFile,
  splitPdfFile,
} from "./services/pdfService";
import { FileUp, Loader2, CheckCircle2, AlertCircle, FileStack } from "lucide-react";
import "./App.css";

export function App() {
  const [currentPdf, setCurrentPdf] = useState<PdfDocumentInfo | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [initialPages, setInitialPages] = useState<PageItem[]>([]);
  const [previewPage, setPreviewPage] = useState<PageItem | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [gridSize, setGridSize] = useState<"small" | "medium" | "large">("medium");

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // PDF 파일 열기
  const handleOpenPdf = async () => {
    try {
      const filePath = await pickPdfFile();
      if (!filePath) return;

      setIsLoading(true);
      setLoadingProgress("파일 분석 중...");

      const { pages: loadedPages, meta } = await loadPdfPages(
        filePath,
        (current, total) => {
          setLoadingProgress(`${current} / ${total} 페이지 로드 중...`);
        }
      );

      setCurrentPdf(meta);
      setPages(loadedPages);
      setInitialPages(loadedPages);
      setIsLoading(false);
      setLoadingProgress("");
      showToast(`'${meta.file_name}' 파일을 성공적으로 열었습니다.`);
    } catch (err) {
      setIsLoading(false);
      setLoadingProgress("");
      showToast(`PDF 열기 실패: ${String(err)}`, "error");
    }
  };

  // 단일 페이지 회전
  const handleRotatePage = (id: string, delta: number) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newRot = (p.rotation + delta + 360) % 360;
          return { ...p, rotation: newRot };
        }
        return p;
      })
    );
    if (previewPage && previewPage.id === id) {
      setPreviewPage((prev) =>
        prev ? { ...prev, rotation: (prev.rotation + delta + 360) % 360 } : null
      );
    }
  };

  // 단일 페이지 삭제
  const handleDeletePage = (id: string) => {
    if (pages.length <= 1) {
      showToast("최소 1개의 페이지는 남아있어야 합니다.", "error");
      return;
    }
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  // 페이지 순서 이동
  const handleMovePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pages.length) return;
    setPages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  // 전체 회전
  const handleRotateAll = (delta: number) => {
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        rotation: (p.rotation + delta + 360) % 360,
      }))
    );
    showToast(`모든 페이지를 ${delta > 0 ? "시계" : "반시계"}방향으로 90° 회전했습니다.`);
  };

  // 초기화 (되돌리기)
  const handleReset = () => {
    setPages(initialPages);
    showToast("초기 페이지 구성으로 복원되었습니다.");
  };

  // 수정된 PDF 저장 / 내보내기
  const handleSavePdf = async () => {
    if (!currentPdf || pages.length === 0) return;

    try {
      const defaultName = `edited_${currentPdf.file_name}`;
      const savePath = await pickSaveLocation(defaultName);
      if (!savePath) return;

      setIsSaving(true);
      await exportPdfFile(currentPdf.file_path, savePath, pages);
      setIsSaving(false);
      showToast(`'${savePath.split("/").pop()}' 저장 완료!`);
    } catch (err) {
      setIsSaving(false);
      showToast(`저장 실패: ${String(err)}`, "error");
    }
  };

  // PDF 분할
  const handleSplitPdf = async () => {
    if (!currentPdf) return;

    try {
      const defaultName = currentPdf.file_name.replace(/\.pdf$/i, "");
      const outputDir = currentPdf.file_path.substring(
        0,
        currentPdf.file_path.lastIndexOf("/")
      );
      const targetDir = `${outputDir}/${defaultName}_split`;

      setIsSaving(true);
      const files = await splitPdfFile(
        currentPdf.file_path,
        targetDir,
        defaultName
      );
      setIsSaving(false);
      showToast(`총 ${files.length}개의 페이지 파일로 분할되었습니다: ${targetDir}`);
    } catch (err) {
      setIsSaving(false);
      showToast(`분할 실패: ${String(err)}`, "error");
    }
  };

  // 그리드 칼럼 크기 매핑
  const gridClasses = {
    small: "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3",
    medium: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4",
    large: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6",
  }[gridSize];

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-sans">
      {/* 상단 내비게이션 바 */}
      <Navbar
        currentPdf={currentPdf}
        onOpenPdf={handleOpenPdf}
        onSavePdf={handleSavePdf}
        onOpenMergeModal={() => setIsMergeModalOpen(true)}
        isSaving={isSaving}
        canSave={pages.length > 0}
      />

      {/* 서브 툴바 (파일이 로드되었을 때만 표시) */}
      {currentPdf && pages.length > 0 && (
        <Toolbar
          pageCount={pages.length}
          originalPageCount={currentPdf.page_count}
          onRotateAll={handleRotateAll}
          onReset={handleReset}
          onSplit={handleSplitPdf}
          gridSize={gridSize}
          setGridSize={setGridSize}
        />
      )}

      {/* 메인 뷰포트 영역 */}
      <main className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 size={36} className="text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {loadingProgress || "PDF 문서를 불러오는 중..."}
            </p>
          </div>
        ) : !currentPdf ? (
          /* 빈 상태 (파일 없음) */
          <div className="flex flex-col items-center justify-center h-full">
            <div className="max-w-md w-full p-8 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mb-4">
                <FileUp size={32} />
              </div>
              <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-1">
                PDF 편집을 시작해보세요
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
                페이지 회전, 순서 변경, 삭제, 병합 및 분할을 지원하는
                <br />
                초경량 네이티브 PDF 편집기입니다.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={handleOpenPdf}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
                >
                  <FileUp size={16} />
                  PDF 파일 열기
                </button>
                <button
                  onClick={() => setIsMergeModalOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-xl transition-colors"
                >
                  <FileStack size={16} />
                  여러 PDF 병합
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* 페이지 썸네일 그리드 */
          <div className={`grid ${gridClasses}`}>
            {pages.map((page, index) => (
              <PageCard
                key={page.id}
                page={page}
                index={index}
                totalCount={pages.length}
                onRotate={handleRotatePage}
                onDelete={handleDeletePage}
                onMove={handleMovePage}
                onPreview={(p) => setPreviewPage(p)}
              />
            ))}
          </div>
        )}
      </main>

      {/* 미리보기 모달 */}
      <PreviewModal
        page={previewPage}
        onClose={() => setPreviewPage(null)}
        onRotate={handleRotatePage}
      />

      {/* PDF 병합 모달 */}
      <MergeModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        onSuccess={(mergedPath) => {
          showToast(`PDF 병합이 성공적으로 완료되었습니다: ${mergedPath}`);
        }}
      />

      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 text-xs font-medium backdrop-blur-xs animate-in slide-in-from-bottom-3 duration-200">
          {toastMessage.type === "success" ? (
            <CheckCircle2 size={16} className="text-emerald-400 dark:text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-400 dark:text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}

export default App;
