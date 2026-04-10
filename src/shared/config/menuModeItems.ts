import { GAME_MODES } from "./constants";
import type { GameMode } from "../types/game.types";

export const MENU_MODE_ITEMS: ReadonlyArray<{
  mode: GameMode;
  title: string;
  blurb: string;
}> = [
  {
    mode: GAME_MODES.CLASSIC,
    title: "Классика",
    blurb: "Стандартные правила",
  },
  {
    mode: GAME_MODES.CRAZY_JUMPS,
    title: "Безумные прыжки",
    blurb: "Длинные прыжки",
  },
  {
    mode: GAME_MODES.PARTY_MODE,
    title: "Вечеринка",
    blurb: "Эффекты и анимации",
  },
  {
    mode: GAME_MODES.TURBO,
    title: "Турбо",
    blurb: "Быстрый бот",
  },
];

/** Кнопка режима в главном меню и в модалке смены режима. */
export const MENU_MODE_CARD_CLASS =
  "flex min-h-[3.75rem] w-full flex-col justify-center gap-0.5 rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-2.5 py-1.5 text-left transition-[border-color,background-color,box-shadow] duration-200 cursor-pointer hover:border-cyan-500/45 hover:bg-zinc-800/95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/80 active:bg-zinc-800 sm:min-h-16 sm:px-3 sm:py-2";
