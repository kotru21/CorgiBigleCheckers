import { GAME_MODES } from "@shared/config/constants";
import type { GameMode } from "../shared/types/game.types";

export const getModeName = (mode: GameMode): string => {
  switch (mode) {
    case GAME_MODES.CLASSIC:
      return "Классический";
    case GAME_MODES.CRAZY_JUMPS:
      return "Безумные прыжки";
    case GAME_MODES.PARTY_MODE:
      return "Вечеринка";
    case GAME_MODES.TURBO:
      return "Турбо";
    default:
      return "Неизвестный";
  }
};
