import type { Position } from "@shared/types/game.types";

export interface GameBoardHudProps {
  gameMessage: string;
  showFpsInfo: boolean;
  onToggleFps: () => void;
  currentFps: number;
  perfDotClass: string;
  hudBtnClass: string;
  onOpenRules: () => void;
  onOpenModeSelector: () => void;
  onReturnToMenu: () => void;
  playerTurn: boolean;
  gameOver: boolean;
  selectedPiece: Position | null;
}

export function GameBoardHud({
  gameMessage,
  showFpsInfo,
  onToggleFps,
  currentFps,
  perfDotClass,
  hudBtnClass,
  onOpenRules,
  onOpenModeSelector,
  onReturnToMenu,
  playerTurn,
  gameOver,
  selectedPiece,
}: GameBoardHudProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col">
      <div className="safe-pt safe-px flex w-full shrink-0 items-center gap-1.5 pt-1.5 sm:gap-2 sm:pt-2">
        <p
          className="pointer-events-none flex h-8 min-h-8 min-w-0 max-w-[min(100%,15.5rem)] items-center rounded-full bg-black/40 px-2.5 text-left text-[10px] leading-none text-zinc-100 shadow-sm backdrop-blur-md sm:max-w-[18rem] sm:px-3 sm:text-[11px]"
          role="status"
          aria-live="polite"
          title={gameMessage}>
          <span className="min-w-0 truncate">{gameMessage}</span>
        </p>
        <div className="pointer-events-auto ml-auto flex h-8 min-h-8 shrink-0 items-center justify-center gap-1.5">
          <button
            type="button"
            className={`${hudBtnClass} ${showFpsInfo ? "text-cyan-200" : ""}`}
            onClick={onToggleFps}
            aria-pressed={showFpsInfo}
            title="Производительность / FPS">
            <span
              className={`inline-block size-1.5 shrink-0 rounded-full ${perfDotClass}`}
              aria-hidden
            />
            <span className="tabular-nums">
              {showFpsInfo ? `${currentFps}` : "FPS"}
            </span>
          </button>
          <button
            type="button"
            onClick={onOpenRules}
            className={hudBtnClass}
            title="Правила">
            ?
          </button>
          <button
            type="button"
            onClick={onOpenModeSelector}
            className={hudBtnClass}
            title="Сменить режим">
            Режим
          </button>
          <button
            type="button"
            onClick={onReturnToMenu}
            className={`${hudBtnClass} text-cyan-200`}
            title="В главное меню">
            Меню
          </button>
        </div>
      </div>

      {playerTurn && !gameOver && (
        <div className="safe-pb safe-px pointer-events-none mt-auto flex justify-center pb-2 sm:pb-3">
          <p className="rounded-full bg-black/40 px-3 py-1 text-center text-[10px] text-zinc-200/95 shadow-sm backdrop-blur-md sm:text-[11px]">
            {selectedPiece
              ? "Коснитесь клетки для хода"
              : "Коснитесь бигля, чтобы походить"}
          </p>
        </div>
      )}
    </div>
  );
}
