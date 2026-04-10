import { GAME_MODES } from "@shared/config/constants";
import type { GameMode } from "../shared/types/game.types";

export const isCrazyJumpsMode = (mode: GameMode): boolean =>
  mode === GAME_MODES.CRAZY_JUMPS;

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

/** Короткая подпись для статуса в игре (одна строка). */
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
    default:
      return "Режим";
  }
};

/** Сообщение, когда снова ход игрока после хода бота. */
export const getPlayerTurnPromptMessage = (mode: GameMode): string =>
  `${getModeNameShort(mode)} · выберите фигуру`;

export const getModeStartMessage = (mode: GameMode): string =>
  `${getModeNameShort(mode)} · ваш ход`;
