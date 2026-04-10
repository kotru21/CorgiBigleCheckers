import type { Position } from "@shared/types/game.types";
import type { PerformanceMode } from "./Board3D/types";

const HUD_BTN_CLASS =
  "inline-flex h-8 min-h-8 shrink-0 items-center justify-center gap-1 rounded-full bg-black/45 px-2.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-zinc-100 shadow-sm backdrop-blur-md transition-[background-color,color] duration-200 cursor-pointer hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400/80 sm:px-3";

function perfDotClassForMode(mode: PerformanceMode): string {
  if (mode === "high") {
    return "bg-zinc-400";
  }
  if (mode === "medium") {
    return "bg-amber-400";
  }
  return "bg-red-500";
}

export interface GameBoardHudProps {
  gameMessage: string;
  showFpsInfo: boolean;
  onToggleFps: () => void;
  currentFps: number;
  performanceMode: PerformanceMode;
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
  performanceMode,
  onOpenRules,
  onOpenModeSelector,
  onReturnToMenu,
  playerTurn,
  gameOver,
  selectedPiece,
}: GameBoardHudProps) {
  const perfDotClass = perfDotClassForMode(performanceMode);

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
            className={`${HUD_BTN_CLASS} ${showFpsInfo ? "text-orange-200" : ""}`}
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
            className={HUD_BTN_CLASS}
            title="Правила">
            ?
          </button>
          <button
            type="button"
            onClick={onOpenModeSelector}
            className={HUD_BTN_CLASS}
            title="Сменить режим">
            Режим
          </button>
          <button
            type="button"
            onClick={onReturnToMenu}
            className={`${HUD_BTN_CLASS} text-orange-200`}
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
