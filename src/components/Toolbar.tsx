import type { FC } from "react";
import { RotateCw, RotateCcw, RotateCcw as ResetIcon, Split } from "lucide-react";

interface ToolbarProps {
  pageCount: number;
  originalPageCount: number;
  onRotateAll: (delta: number) => void;
  onReset: () => void;
  onSplit: () => void;
  gridSize: "small" | "medium" | "large";
  setGridSize: (size: "small" | "medium" | "large") => void;
}

export const Toolbar: FC<ToolbarProps> = ({
  pageCount,
  originalPageCount,
  onRotateAll,
  onReset,
  onSplit,
  gridSize,
  setGridSize,
}) => {
  return (
    <div className="h-11 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700 px-4 flex items-center justify-between text-xs shrink-0">
      {/* 좌측: 일괄 회전 및 분할 조작 */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onRotateAll(-90)}
          className="flex items-center gap-1 px-2.5 py-1 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 rounded transition-colors"
          title="모든 페이지 반시계방향 90° 회전"
        >
          <RotateCcw size={13} />
          <span>전체 반시계 회전</span>
        </button>

        <button
          onClick={() => onRotateAll(90)}
          className="flex items-center gap-1 px-2.5 py-1 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 rounded transition-colors"
          title="모든 페이지 시계방향 90° 회전"
        >
          <RotateCw size={13} />
          <span>전체 시계 회전</span>
        </button>

        <div className="h-4 w-[1px] bg-zinc-300 dark:bg-zinc-700 mx-1" />

        <button
          onClick={onSplit}
          className="flex items-center gap-1 px-2.5 py-1 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 rounded transition-colors"
          title="각 페이지를 개별 PDF 파일로 분할 저장"
        >
          <Split size={13} className="text-amber-500" />
          <span>페이지별 분할</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1 px-2.5 py-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 rounded transition-colors"
          title="초기 상태로 되돌리기"
        >
          <ResetIcon size={13} />
          <span>초기화</span>
        </button>
      </div>

      {/* 우측: 상태 정보 & 그리드 크기 조절 */}
      <div className="flex items-center gap-4">
        <span className="text-zinc-500 dark:text-zinc-400">
          페이지: <b className="text-zinc-800 dark:text-zinc-200">{pageCount}</b>
          {pageCount !== originalPageCount && (
            <span className="text-zinc-400"> (원래 {originalPageCount}개)</span>
          )}
        </span>

        {/* 그리드 크기 토글 */}
        <div className="flex items-center bg-zinc-200/70 dark:bg-zinc-700/60 rounded p-0.5">
          <button
            onClick={() => setGridSize("small")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              gridSize === "small"
                ? "bg-white dark:bg-zinc-800 text-blue-600 shadow-xs"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            소
          </button>
          <button
            onClick={() => setGridSize("medium")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              gridSize === "medium"
                ? "bg-white dark:bg-zinc-800 text-blue-600 shadow-xs"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            중
          </button>
          <button
            onClick={() => setGridSize("large")}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              gridSize === "large"
                ? "bg-white dark:bg-zinc-800 text-blue-600 shadow-xs"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            대
          </button>
        </div>
      </div>
    </div>
  );
};
