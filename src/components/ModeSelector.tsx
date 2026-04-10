import { useGame } from "../store/gameStore";
import {
  MENU_MODE_CARD_CLASS,
  MENU_MODE_ITEMS,
} from "@shared/config/menuModeItems";
import { createInitialBoard } from "../services/BoardService";
import { getModeStartMessage } from "../utils/modeHelpers";
import type { GameMode } from "@shared/types/game.types";

interface ModeSelectorProps {
  onClose: () => void;
}

export function ModeSelector({ onClose }: ModeSelectorProps) {
  const { setGameMode, setBoard, setPlayerTurn, setGameOver, setGameMessage } =
    useGame();

  const handleSelectMode = (mode: GameMode) => {
    setGameMode(mode);
    const newBoard = createInitialBoard();
    setBoard(newBoard);
    setPlayerTurn(true);
    setGameOver(false);
    setGameMessage(getModeStartMessage(mode));
    onClose();
  };

  return (
    <div
      className="safe-pt safe-pb safe-px fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mode-selector-title">
      <div className="max-h-[min(88dvh,720px)] w-full max-w-md overflow-hidden rounded-t-2xl border border-zinc-800/90 bg-(--color-surface) shadow-2xl backdrop-blur-md sm:max-w-lg sm:rounded-2xl">
        <div className="max-h-[inherit] overflow-y-auto overscroll-y-contain p-3 sm:p-5">
          <h2
            id="mode-selector-title"
            className="font-display mb-3 border-b border-zinc-800/80 pb-2 text-center text-lg font-bold text-zinc-100 sm:mb-4 sm:text-xl">
            Режим игры
          </h2>

          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {MENU_MODE_ITEMS.map(({ mode, title, blurb }) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleSelectMode(mode)}
                className={MENU_MODE_CARD_CLASS}>
                <span className="font-display text-sm font-bold text-zinc-100 sm:text-base">
                  {title}
                </span>
                <span className="line-clamp-2 text-[10px] leading-snug text-zinc-500 sm:text-xs">
                  {blurb}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-3 min-h-11 w-full rounded-xl border border-zinc-600 bg-zinc-800/80 py-2.5 text-sm font-semibold text-zinc-200 transition-colors duration-200 cursor-pointer hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 sm:mt-4">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
