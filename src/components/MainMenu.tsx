import { useState } from "react";
import { useGame } from "../store/gameStore";
import {
  MENU_MODE_CARD_CLASS,
  MENU_MODE_ITEMS,
} from "@shared/config/menuModeItems";
import RulesModal from "./RulesModal";
import type { GameMode } from "@shared/types/game.types";

interface MainMenuProps {
  onStartGame: () => void;
}

export function MainMenu({ onStartGame }: MainMenuProps) {
  const beginMatch = useGame((s) => s.beginMatch);
  const [showRules, setShowRules] = useState(false);

  const handleSelectMode = (mode: GameMode) => {
    beginMatch(mode);
    onStartGame();
  };

  return (
    <div className="fixed inset-0 flex h-dvh max-h-dvh flex-col overflow-hidden bg-zinc-950 bg-linear-to-b from-zinc-950 via-zinc-900 to-black">
      <div className="safe-pt safe-pb safe-px flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain px-2 pb-2 pt-1 sm:px-4 sm:pb-3 sm:pt-2">
        <div className="mx-auto my-auto w-full max-w-md shrink-0 flex flex-col rounded-2xl border border-zinc-800/90 bg-(--color-surface) shadow-xl backdrop-blur-md sm:max-w-lg sm:rounded-3xl">
          <header className="shrink-0 border-b border-zinc-800/80 px-3 py-2 sm:px-4 sm:py-2.5">
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400/90 sm:text-xs">
              Шашки 10×10
            </p>
            <h1 className="font-display text-lg font-bold leading-tight text-zinc-100 sm:text-2xl">
              Корги против биглей
            </h1>
          </header>

          <div className="px-3 py-2 sm:px-4 sm:py-2.5">
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {MENU_MODE_ITEMS.map(({ mode, title, blurb }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleSelectMode(mode)}
                  className={MENU_MODE_CARD_CLASS}>
                  <span className="font-display text-sm font-bold leading-tight text-zinc-100 sm:text-base">
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
              onClick={() => setShowRules(true)}
              className="mt-2 flex min-h-9 w-full items-center justify-center rounded-xl border border-dashed border-zinc-600/90 bg-zinc-900/50 px-3 py-1.5 text-sm font-semibold text-zinc-300 transition-colors duration-200 cursor-pointer hover:border-cyan-500/40 hover:bg-cyan-950/30 hover:text-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/70 sm:mt-2.5">
              Правила игры
            </button>
          </div>
        </div>
      </div>

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}
