import { GAME_MODES } from "@/shared/config/constants";
import type { GameMode, Variant } from "@/shared/types/game.types";

export interface RuleOptions {
  variant: Variant;
  boardSize: number;
  longMenCaptures: boolean;
  majorityRule: boolean;
  promoteDuringCapture: boolean;
  kingMoveDrawPlies: number;
}

export const VARIANT_RULES: Record<Variant, RuleOptions> = {
  international: {
    variant: "international",
    boardSize: 10,
    longMenCaptures: false,
    majorityRule: true,
    promoteDuringCapture: false,
    kingMoveDrawPlies: 50,
  },
  russian: {
    variant: "russian",
    boardSize: 8,
    longMenCaptures: false,
    majorityRule: false,
    promoteDuringCapture: true,
    kingMoveDrawPlies: 30,
  },
};

export const CLASSIC_RULES = VARIANT_RULES.international;
export const RUSSIAN_RULES = VARIANT_RULES.russian;

export const rulesFor = (variant: Variant, mode: GameMode): RuleOptions => ({
  ...VARIANT_RULES[variant],
  longMenCaptures: mode === GAME_MODES.CRAZY_JUMPS,
});
