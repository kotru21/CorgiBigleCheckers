import { useState } from "react";
import { beginMatchFromUI } from "@/match/matchSessionActions";
import { loadSolvedPuzzles, PUZZLES, puzzleSettings } from "@/match/puzzles";
import { useModalDialog } from "./hooks/useModalDialog";

interface PuzzleListProps {
  onClose: () => void;
  onStart: () => void;
}

const VARIANT_TITLES = {
  international: "Международные 10×10",
  russian: "Русские 8×8",
} as const;

const movesLabel = (moves: number) =>
  moves === 1 ? "в 1 ход" : moves < 5 ? `в ${moves} хода` : `в ${moves} ходов`;

export function PuzzleList({ onClose, onStart }: PuzzleListProps) {
  const { containerRef, initialFocusRef } = useModalDialog(onClose);
  const [solved] = useState(loadSolvedPuzzles);

  return (
    <div
      className="safe-pt safe-pb safe-px fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}>
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="puzzle-list-title"
        className="max-h-[min(88dvh,720px)] w-full max-w-md overflow-hidden rounded-t-2xl border border-zinc-800/90 bg-(--color-surface) shadow-2xl backdrop-blur-md sm:max-w-lg sm:rounded-2xl">
        <div className="max-h-[inherit] overflow-y-auto overscroll-y-contain p-3 sm:p-5">
          <h2
            id="puzzle-list-title"
            className="font-display mb-1 text-center text-lg font-bold text-zinc-100 sm:text-xl">
            Задачи
          </h2>
          <p className="mb-3 text-center text-xs text-zinc-400">
            Найдите выигрыш: соперник защищается как можно дольше. Решено{" "}
            {solved.length} из {PUZZLES.length}.
          </p>

          {(["international", "russian"] as const).map((variant) => {
            const list = PUZZLES.filter((puzzle) => puzzle.variant === variant);
            if (list.length === 0) {
              return null;
            }
            return (
              <section key={variant} className="mb-3">
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-orange-300">
                  {VARIANT_TITLES[variant]}
                </h3>
                <ul className="grid gap-1.5">
                  {list.map((puzzle) => (
                    <li key={puzzle.id}>
                      <button
                        type="button"
                        onClick={() => {
                          beginMatchFromUI(puzzleSettings(puzzle));
                          onStart();
                        }}
                        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-3 py-2 text-left transition-colors duration-200 cursor-pointer hover:border-orange-500/50 hover:bg-zinc-800/95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400/80">
                        <span>
                          <span className="block text-sm font-semibold text-zinc-100">
                            {puzzle.title}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {puzzle.toMove === "beagle" ? "Бигли" : "Корги"}{" "}
                            начинают и выигрывают {movesLabel(puzzle.moves)}
                          </span>
                        </span>
                        {solved.includes(puzzle.id) && (
                          <span
                            className="text-emerald-400"
                            aria-label="решена">
                            ✓
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          <button
            ref={initialFocusRef}
            type="button"
            onClick={onClose}
            className="mt-1 min-h-11 w-full rounded-xl border border-zinc-600 bg-zinc-800/80 py-2.5 text-sm font-semibold text-zinc-200 transition-colors duration-200 cursor-pointer hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
