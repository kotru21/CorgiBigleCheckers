import { BEAGLE, CORGI, GAME_MODES, VARIANTS } from "@/shared/config/constants";
import type {
  GameMode,
  Opponent,
  Player,
  Variant,
} from "@/shared/types/game.types";
import { opponentOf } from "@/engine";

export interface MatchSettings {
  variant: Variant;
  mode: GameMode;
  opponent: Opponent;
  humanSide: Player;
  puzzleId: string | null;
}

export const DEFAULT_SETTINGS: MatchSettings = {
  variant: VARIANTS.INTERNATIONAL,
  mode: GAME_MODES.CLASSIC,
  opponent: "bot",
  humanSide: BEAGLE,
  puzzleId: null,
};

export const isHumanControlled = (settings: MatchSettings, side: Player) =>
  settings.opponent === "human" || side === settings.humanSide;

export const botSideOf = (settings: MatchSettings): Player | null =>
  settings.opponent === "bot" ? opponentOf(settings.humanSide) : null;

const oneOf = <T extends string>(
  value: unknown,
  options: readonly T[]
): value is T =>
  typeof value === "string" && (options as readonly string[]).includes(value);

export const isMatchSettings = (value: unknown): value is MatchSettings => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    oneOf(v.variant, Object.values(VARIANTS)) &&
    oneOf(v.mode, Object.values(GAME_MODES)) &&
    oneOf(v.opponent, ["bot", "human"] as const) &&
    oneOf(v.humanSide, [BEAGLE, CORGI] as const) &&
    (v.puzzleId === null || typeof v.puzzleId === "string")
  );
};
