import { GAME_MODES } from "@/shared/config/constants";
import type { GameMode } from "@/shared/types/game.types";

export const getModeNameShort = (mode: GameMode): string => {
  switch (mode) {
    case GAME_MODES.CLASSIC:
      return "Классика";
    case GAME_MODES.CRAZY_JUMPS:
      return "Прыжки";
    case GAME_MODES.PARTY_MODE:
      return "Вечеринка";
    case GAME_MODES.TURBO:
      return "Турбо";
  }
};

export const getPlayerTurnPromptMessage = (mode: GameMode): string =>
  `${getModeNameShort(mode)} · выберите фигуру`;

export const getModeStartMessage = (mode: GameMode): string =>
  `${getModeNameShort(mode)} · ваш ход`;
