import type { FC } from "react";
import { FolderOpen, Save, FileStack, Sparkles } from "lucide-react";
import { PdfDocumentInfo } from "../types";

interface NavbarProps {
  currentPdf: PdfDocumentInfo | null;
  onOpenPdf: () => void;
  onSavePdf: () => void;
  onOpenMergeModal: () => void;
  isSaving: boolean;
  canSave: boolean;
}

export const Navbar: FC<NavbarProps> = ({
  currentPdf,
  onOpenPdf,
  onSavePdf,
  onOpenMergeModal,
  isSaving,
  canSave,
}) => {
  return (
    <header className="h-14 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-4 flex items-center justify-between shrink-0">
      {/* 로고 & 현재 파일 정보 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm">
            <Sparkles size={16} />
          </div>
          <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 hidden sm:inline">
            PDF Editor
          </span>
        </div>

        {currentPdf && (
          <div className="flex items-center gap-2 pl-3 border-l border-zinc-200 dark:border-zinc-700 text-xs">
            <span
              className="font-medium text-zinc-700 dark:text-zinc-200 max-w-[200px] truncate"
              title={currentPdf.file_path}
            >
              {currentPdf.file_name}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 text-[11px]">
              {(currentPdf.file_size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        )}
      </div>

      {/* 우측 주요 액션 버튼 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenMergeModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-colors"
        >
          <FileStack size={14} className="text-indigo-500" />
          <span>PDF 병합</span>
        </button>

        <button
          onClick={onOpenPdf}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-700 transition-colors"
        >
          <FolderOpen size={14} className="text-blue-500" />
          <span>파일 열기</span>
        </button>

        <button
          onClick={onSavePdf}
          disabled={!canSave || isSaving}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Save size={14} />
          <span>{isSaving ? "저장 중..." : "새 PDF로 저장"}</span>
        </button>
      </div>
    </header>
  );
};
