export const BOARD_SIZE = 10 as const;
export const PLAYER = "beagle" as const;
export const BOT = "corgi" as const;
export const PLAYER_KING = "beagle-king" as const;
export const BOT_KING = "corgi-king" as const;
export const EMPTY: null = null;

export const GAME_MODES = {
  CLASSIC: "classic",
  CRAZY_JUMPS: "crazy_jumps",
  PARTY_MODE: "party_mode",
  TURBO: "turbo",
} as const;

export const MOVE_TYPES = {
  NORMAL: "normal",
  CAPTURE: "capture",
  MULTI_CAPTURE: "multi_capture",
} as const;

export const GAME_STATES = {
  MENU: "menu",
  PLAYING: "playing",
  PAUSED: "paused",
  GAME_OVER: "game_over",
  RULES_MODAL: "rules_modal",
} as const;

export const PERFORMANCE_MODES = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;

export const DIRECTIONS = {
  PLAYER: [
    [-1, -1],
    [-1, 1],
  ],
  BOT: [
    [1, -1],
    [1, 1],
  ],
  KING: [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ],
} as const;

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
  BOARD: {
    SIZE: BOARD_SIZE,
    DARK_SQUARES_ONLY: true,
  },
  PERFORMANCE: {
    CACHE_SIZE_LIMIT: 1000,
    FPS_TARGET: 60,
    FPS_WARNING_THRESHOLD: 30,
    FPS_CRITICAL_THRESHOLD: 15,
  },
} as const;

export const VALIDATION_RULES = {
  MIN_BOARD_SIZE: 8,
  MAX_BOARD_SIZE: 12,
  MIN_PIECES_PER_SIDE: 12,
  MAX_PIECES_PER_SIDE: 20,
} as const;

export const LOG_CONFIG = {
  ENABLED: true,
  LEVEL: "INFO",
  MAX_LOGS: 1000,
} as const;
