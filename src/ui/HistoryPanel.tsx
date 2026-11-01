import { useState } from "react";
import { logger } from "@/shared/logger";

interface HistoryPanelProps {
  notations: string[];
  record: string;
  startsWithWhite: boolean;
  onClose: () => void;
}

export function HistoryPanel({
  notations,
  record,
  startsWithWhite,
  onClose,
}: HistoryPanelProps) {
  const [copied, setCopied] = useState(false);
  const plies = startsWithWhite ? notations : ["…", ...notations];
  const rows = Array.from({ length: Math.ceil(plies.length / 2) }, (_, i) =>
    plies.slice(i * 2, i * 2 + 2)
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(record);
      setCopied(true);
    } catch (error) {
      logger.warn("Не удалось скопировать запись партии:", error);
    }
  };

  return (
    <aside
      aria-label="Запись партии"
      className="safe-px absolute bottom-16 right-2 z-30 flex max-h-[min(50dvh,24rem)] w-56 flex-col rounded-2xl border border-zinc-700/90 bg-(--color-surface) p-3 shadow-2xl backdrop-blur-md sm:right-3 sm:w-64">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="font-display text-sm font-bold text-zinc-100">
          Запись партии
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть запись партии"
          className="rounded-full px-2 text-zinc-400 cursor-pointer hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-orange-400/80">
          ✕
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-zinc-500">Ходов пока нет</p>
      ) : (
        <ol className="min-h-0 flex-1 overflow-y-auto font-mono text-xs text-zinc-200">
          {rows.map((pair, i) => (
            <li
              key={i}
              className="grid grid-cols-[2rem_1fr_1fr] gap-1 py-0.5 odd:bg-white/5">
              <span className="text-zinc-500">{i + 1}.</span>
              <span>{pair[0]}</span>
              <span>{pair[1] ?? ""}</span>
            </li>
          ))}
        </ol>
      )}
      <button
        type="button"
        onClick={() => void copy()}
        disabled={rows.length === 0}
        className="mt-2 min-h-8 rounded-lg border border-zinc-600 bg-zinc-800/80 text-xs font-semibold text-zinc-200 cursor-pointer hover:bg-zinc-700 disabled:cursor-default disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-orange-400/80">
        {copied ? "Скопировано" : "Скопировать запись"}
      </button>
    </aside>
  );
}
