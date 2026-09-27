import { useState } from "react";
import type { FC } from "react";
import { X, Plus, Trash2, ArrowUp, ArrowDown, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { pickMultiplePdfFiles, pickSaveLocation, mergePdfFiles } from "../services/pdfService";

interface MergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (targetPath: string) => void;
}

export const MergeModal: FC<MergeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [filePaths, setFilePaths] = useState<string[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddFiles = async () => {
    try {
      const selected = await pickMultiplePdfFiles();
      if (selected.length > 0) {
        setFilePaths((prev) => [...prev, ...selected]);
        setError(null);
      }
    } catch (err) {
      setError(String(err));
    }
  };

  const handleRemove = (index: number) => {
    setFilePaths((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filePaths.length) return;

    setFilePaths((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  const handleMerge = async () => {
    if (filePaths.length < 2) {
      setError("병합하려면 2개 이상의 PDF 파일이 필요합니다.");
      return;
    }

    try {
      const savePath = await pickSaveLocation("merged.pdf");
      if (!savePath) return;

      setIsMerging(true);
      setError(null);
      await mergePdfFiles(filePaths, savePath);
      setIsMerging(false);
      onSuccess(savePath);
      onClose();
    } catch (err) {
      setIsMerging(false);
      setError(String(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="flex flex-col w-full max-w-lg bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                PDF 파일 병합
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                여러 PDF 파일을 순서대로 합쳐 하나의 파일로 만듭니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 모달 바디: 파일 목록 */}
        <div className="p-6 flex-1 max-h-[360px] overflow-y-auto space-y-3">
          {error && (
            <div className="p-3 text-xs rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}

          {filePaths.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-center">
              <FileText size={36} className="text-zinc-400 mb-2" />
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                선택된 PDF 파일이 없습니다
              </p>
              <p className="text-xs text-zinc-500 mt-1 mb-4">
                아래 버튼을 눌러 병합할 PDF 파일들을 추가하세요.
              </p>
              <button
                onClick={handleAddFiles}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow transition-colors"
              >
                <Plus size={14} /> 파일 추가하기
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filePaths.map((filePath, idx) => {
                const fileName = filePath.split("/").pop() || filePath;
                return (
                  <div
                    key={filePath + idx}
                    className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate" title={filePath}>
                        {fileName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleMove(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => handleMove(idx, "down")}
                        disabled={idx === filePaths.length - 1}
                        className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        onClick={() => handleRemove(idx)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={handleAddFiles}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/30 text-xs font-medium rounded-lg transition-colors"
              >
                <Plus size={14} /> 파일 더 추가하기
              </button>
            </div>
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-50 dark:bg-zinc-800/80 border-t border-zinc-200 dark:border-zinc-700">
          <span className="text-xs text-zinc-500">
            총 {filePaths.length}개 파일
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleMerge}
              disabled={filePaths.length < 2 || isMerging}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg shadow transition-colors"
            >
              {isMerging ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  병합 중...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  병합하여 저장
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
