import { useModalDialog } from "@/ui/hooks/useModalDialog";

export interface GameOverSheetProps {
  title: string;
  primaryLabel: string;
  onPrimary: () => void;
  onReturnToMenu: () => void;
  onUndo?: (() => void) | undefined;
}

export function GameOverSheet({
  title,
  primaryLabel,
  onPrimary,
  onReturnToMenu,
  onUndo,
}: GameOverSheetProps) {
  const { containerRef, initialFocusRef } = useModalDialog();

  return (
    <div
      className="safe-pt safe-pb safe-px fixed inset-0 z-30 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-over-title"
        className="w-full max-w-sm animate-[appear_0.35s_ease-out] rounded-t-2xl border border-zinc-700/90 bg-(--color-surface) p-4 shadow-2xl backdrop-blur-xl sm:max-w-md sm:rounded-2xl sm:p-6">
        <div className="mb-4 h-0.5 w-12 rounded-full bg-orange-400/85 sm:mx-auto" />
        <h2
          id="game-over-title"
          className="font-display mb-4 text-center text-lg font-bold leading-snug text-zinc-100 sm:text-xl">
          {title}
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <button
            ref={initialFocusRef}
            type="button"
            onClick={onPrimary}
            className="min-h-11 flex-1 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-zinc-950 shadow-lg transition-[filter] duration-200 cursor-pointer hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300">
            {primaryLabel}
          </button>
          <button
            type="button"
            onClick={onReturnToMenu}
            className="min-h-11 flex-1 rounded-xl border border-zinc-600 bg-zinc-800/80 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-colors duration-200 cursor-pointer hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500">
            В меню
          </button>
        </div>
        {onUndo && (
          <button
            type="button"
            onClick={onUndo}
            className="mt-2 min-h-10 w-full rounded-xl text-sm font-semibold text-zinc-300 transition-colors duration-200 cursor-pointer hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500">
            ↶ Отменить последний ход
          </button>
        )}
      </div>
    </div>
  );
}
