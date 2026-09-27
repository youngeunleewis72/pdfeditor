import type { FC } from "react";
import { RotateCw, RotateCcw, Trash2, ArrowLeft, ArrowRight, Maximize2 } from "lucide-react";
import { PageItem } from "../types";

interface PageCardProps {
  page: PageItem;
  index: number;
  totalCount: number;
  onRotate: (id: string, delta: number) => void;
  onDelete: (id: string) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onPreview: (page: PageItem) => void;
}

export const PageCard: FC<PageCardProps> = ({
  page,
  index,
  totalCount,
  onRotate,
  onDelete,
  onMove,
  onPreview,
}) => {
  return (
    <div className="group relative flex flex-col bg-white dark:bg-zinc-800 rounded-xl shadow-sm hover:shadow-md border border-zinc-200 dark:border-zinc-700 transition-all duration-200 overflow-hidden">
      {/* 카드 헤더: 페이지 번호 및 회전 각도 배지 */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-200">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold">
            {index + 1}
          </span>
          <span className="text-zinc-400 dark:text-zinc-500">
            (원본 {page.originalPage}p)
          </span>
        </div>
        {page.rotation !== 0 && (
          <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-semibold text-[10px]">
            {page.rotation}°
          </span>
        )}
      </div>

      {/* 썸네일 영역 */}
      <div
        onClick={() => onPreview(page)}
        className="relative flex items-center justify-center p-4 min-h-[220px] bg-zinc-100 dark:bg-zinc-900/50 cursor-pointer overflow-hidden"
      >
        <div
          className="transition-transform duration-300 ease-out shadow-sm"
          style={{
            transform: `rotate(${page.rotation}deg)`,
          }}
        >
          <img
            src={page.thumbnailUrl}
            alt={`Page ${index + 1}`}
            className="max-h-[180px] w-auto object-contain rounded border border-zinc-200 dark:border-zinc-700"
          />
        </div>

        {/* 호버 시 미리보기 아이콘 */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="p-2 bg-white/90 dark:bg-zinc-800/90 rounded-full shadow-lg text-zinc-700 dark:text-zinc-200">
            <Maximize2 size={16} />
          </div>
        </div>
      </div>

      {/* 하단 제어 툴바 */}
      <div className="grid grid-cols-5 divide-x divide-zinc-200 dark:divide-zinc-700 bg-white dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">
        {/* 왼쪽으로 이동 */}
        <button
          onClick={() => onMove(index, index - 1)}
          disabled={index === 0}
          title="앞으로 이동"
          className="p-2 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ArrowLeft size={14} />
        </button>

        {/* 반시계 90도 회전 */}
        <button
          onClick={() => onRotate(page.id, -90)}
          title="반시계방향 90° 회전"
          className="p-2 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-blue-600 transition-colors"
        >
          <RotateCcw size={14} />
        </button>

        {/* 시계 90도 회전 */}
        <button
          onClick={() => onRotate(page.id, 90)}
          title="시계방향 90° 회전"
          className="p-2 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-blue-600 transition-colors"
        >
          <RotateCw size={14} />
        </button>

        {/* 오른쪽으로 이동 */}
        <button
          onClick={() => onMove(index, index + 1)}
          disabled={index === totalCount - 1}
          title="뒤로 이동"
          className="p-2 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ArrowRight size={14} />
        </button>

        {/* 삭제 */}
        <button
          onClick={() => onDelete(page.id)}
          title="페이지 삭제"
          className="p-2 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
