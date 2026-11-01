import { useEffect, useState } from "react";
import { BEAGLE, CORGI, VARIANTS } from "@/shared/config/constants";
import type {
  GameMode,
  Opponent,
  Player,
  Variant,
} from "@/shared/types/game.types";
import { readStored, writeStored } from "@/shared/storage";
import {
  beginMatchFromUI,
  resumeMatchFromUI,
} from "@/match/matchSessionActions";
import { matchLabel } from "@/match/matchLifecycle";
import { loadSavedMatch } from "@/match/savedMatch";
import {
  DEFAULT_SETTINGS,
  isMatchSettings,
  type MatchSettings,
} from "@/match/settings";
import { DifficultySelector } from "./DifficultySelector";
import { MENU_MODE_CARD_CLASS, MENU_MODE_ITEMS } from "./menuModeItems";
import { PuzzleList } from "./PuzzleList";
import RulesModal from "./RulesModal";
import { SegmentedControl } from "./SegmentedControl";
import { usePreferences } from "./preferencesStore";

interface MainMenuProps {
  onStartGame: () => void;
}

const SECONDARY_BUTTON =
  "flex min-h-9 flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-600/90 bg-zinc-900/50 px-3 py-1.5 text-sm font-semibold text-zinc-300 transition-colors duration-200 cursor-pointer hover:border-orange-500/45 hover:bg-orange-950/35 hover:text-orange-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400/75";

export function MainMenu({ onStartGame }: MainMenuProps) {
  const [showRules, setShowRules] = useState(false);
  const [showPuzzles, setShowPuzzles] = useState(false);
  const [saved] = useState(loadSavedMatch);
  const [choice, setChoice] = useState<MatchSettings>(
    () => readStored("menu-settings", isMatchSettings) ?? DEFAULT_SETTINGS
  );
  const view = usePreferences((s) => s.view);

  useEffect(() => {
    void import("./GameBoard");
    if (view === "3d") {
      void import("@/scene/Board3D");
    }
  }, [view]);

  const update = (patch: Partial<MatchSettings>) => {
    const next = { ...choice, ...patch, puzzleId: null };
    setChoice(next);
    writeStored("menu-settings", next);
  };

  const start = (mode: GameMode) => {
    beginMatchFromUI({ ...choice, mode, puzzleId: null });
    onStartGame();
  };

  const resume = () => {
    if (resumeMatchFromUI()) {
      onStartGame();
    }
  };

  return (
    <div className="fixed inset-0 flex h-dvh max-h-dvh flex-col overflow-hidden bg-zinc-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-no-repeat bg-center portrait:max-sm:bg-position-[46%_38%] sm:portrait:bg-position-[48%_40%] md:bg-center"
        style={{ backgroundImage: "url(/bg.webp)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/75 via-black/50 to-black/80 sm:from-black/60 sm:via-black/40 sm:to-black/70"
      />
      <div className="safe-pt safe-pb safe-px relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain px-2 pb-2 pt-1 sm:px-4 sm:pb-3 sm:pt-2">
        <div className="mx-auto my-auto w-full max-w-md shrink-0 flex flex-col rounded-2xl border border-zinc-800/90 bg-(--color-surface) shadow-xl shadow-black/40 backdrop-blur-md sm:max-w-lg sm:rounded-3xl">
          <header className="shrink-0 border-b border-zinc-800/80 px-3 py-2 sm:px-4 sm:py-2.5">
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-400/90 sm:text-xs">
              Шашки
            </p>
            <h1 className="font-display text-lg font-bold leading-tight text-zinc-100 sm:text-2xl">
              Корги против биглей
            </h1>
          </header>

          <div className="flex flex-col gap-2 px-3 py-2 sm:gap-2.5 sm:px-4 sm:py-2.5">
            {saved && (
              <button
                type="button"
                onClick={resume}
                className="min-h-11 rounded-xl bg-orange-600 px-3 py-2 text-left text-sm font-bold text-zinc-950 shadow-lg transition-[filter] duration-200 cursor-pointer hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300">
                Продолжить партию
                <span className="block text-xs font-semibold text-zinc-900/80">
                  {matchLabel(saved.settings)}
                  {saved.settings.opponent === "human" ? " · вдвоём" : ""} ·
                  сделано ходов: {saved.moves.length}
                </span>
              </button>
            )}

            <SegmentedControl<Variant>
              label="Шашки"
              value={choice.variant}
              options={[
                { value: VARIANTS.INTERNATIONAL, title: "Международные 10×10" },
                { value: VARIANTS.RUSSIAN, title: "Русские 8×8" },
              ]}
              onChange={(variant) => update({ variant })}
            />
            <SegmentedControl<Opponent>
              label="Соперник"
              value={choice.opponent}
              options={[
                { value: "bot", title: "Бот" },
                { value: "human", title: "Вдвоём" },
              ]}
              onChange={(opponent) => update({ opponent })}
            />
            {choice.opponent === "bot" && (
              <>
                <SegmentedControl<Player>
                  label="Играю за"
                  value={choice.humanSide}
                  options={[
                    { value: BEAGLE, title: "Биглей (1-й ход)" },
                    { value: CORGI, title: "Корги" },
                  ]}
                  onChange={(humanSide) => update({ humanSide })}
                />
                <DifficultySelector />
              </>
            )}

            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {MENU_MODE_ITEMS.map(({ mode, title, blurb }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => start(mode)}
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

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPuzzles(true)}
                className={SECONDARY_BUTTON}>
                Задачи
              </button>
              <button
                type="button"
                onClick={() => setShowRules(true)}
                className={SECONDARY_BUTTON}>
                Правила игры
              </button>
            </div>
          </div>
        </div>
      </div>

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      {showPuzzles && (
        <PuzzleList
          onClose={() => setShowPuzzles(false)}
          onStart={onStartGame}
        />
      )}
    </div>
  );
}
