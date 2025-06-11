// src/models/Constants.js
export const BOARD_SIZE = 10;
export const PLAYER = "beagle";
export const BOT = "corgi";
export const PLAYER_KING = "beagle-king";
export const BOT_KING = "corgi-king";
export const EMPTY = null;

export const GAME_MODES = {
  CLASSIC: "classic",
  CRAZY_JUMPS: "crazy_jumps",
  PARTY_MODE: "party_mode",
  TURBO: "turbo",
};

// Добавляем константы для типов ходов
export const MOVE_TYPES = {
  NORMAL: "normal",
  CAPTURE: "capture",
  MULTI_CAPTURE: "multi_capture",
};

// Константы для состояний игры
export const GAME_STATES = {
  MENU: "menu",
  PLAYING: "playing",
  PAUSED: "paused",
  GAME_OVER: "game_over",
};

// Константы для режимов производительности
export const PERFORMANCE_MODES = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

// Константы для направлений движения
export const DIRECTIONS = {
  PLAYER: [
    [-1, -1], // диагональ вверх-влево
    [-1, 1],  // диагональ вверх-вправо
  ],
  BOT: [
    [1, -1],  // диагональ вниз-влево
    [1, 1],   // диагональ вниз-вправо
  ],
  KING: [
    [-1, -1], // диагональ вверх-влево
    [-1, 1],  // диагональ вверх-вправо
    [1, -1],  // диагональ вниз-влево
    [1, 1],   // диагональ вниз-вправо
  ],
};

// Настройки игры
export const GAME_CONFIG = {
  AI_DEPTH: {
    EASY: 2,
    MEDIUM: 3,
    HARD: 4,
    TURBO: 4,
  },
  AI_DELAY: {
    TURBO: 300,
    NORMAL: 1000,
  },
  PIECE_VALUES: {
    REGULAR: 10,
    KING: 30,
  },
};
