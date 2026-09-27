import type { FC } from "react";
import { X, RotateCw, RotateCcw } from "lucide-react";
import { PageItem } from "../types";

interface PreviewModalProps {
  page: PageItem | null;
  onClose: () => void;
  onRotate: (id: string, delta: number) => void;
}

export const PreviewModal: FC<PreviewModalProps> = ({ page, onClose, onRotate }) => {
  if (!page) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="flex flex-col max-w-4xl w-full max-h-[90vh] bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              페이지 미리보기 (원본 {page.originalPage}페이지)
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
              {page.rotation}°
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onRotate(page.id, -90)}
              title="반시계 90° 회전"
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={() => onRotate(page.id, 90)}
              title="시계 90° 회전"
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              <RotateCw size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 바디 */}
        <div className="flex-1 flex items-center justify-center p-8 bg-zinc-100 dark:bg-zinc-900/60 overflow-auto">
          <div
            className="transition-transform duration-300 ease-out shadow-xl"
            style={{
              transform: `rotate(${page.rotation}deg)`,
            }}
          >
            <img
              src={page.thumbnailUrl}
              alt={`Page ${page.originalPage}`}
              className="max-h-[70vh] w-auto object-contain rounded-sm bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
