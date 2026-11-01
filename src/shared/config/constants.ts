export const BEAGLE = "beagle" as const;
export const CORGI = "corgi" as const;
export const BEAGLE_KING = "beagle-king" as const;
export const CORGI_KING = "corgi-king" as const;
export const EMPTY: null = null;

export const GAME_MODES = {
  CLASSIC: "classic",
  CRAZY_JUMPS: "crazy_jumps",
  PARTY_MODE: "party_mode",
  TURBO: "turbo",
} as const;

export const VARIANTS = {
  INTERNATIONAL: "international",
  RUSSIAN: "russian",
} as const;

export const DIFFICULTIES = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
} as const;

export interface AiPreset {
  maxDepth: number;
  timeLimitMs: number;
  randomMargin: number;
}

export const AI_PRESETS = {
  easy: { maxDepth: 2, timeLimitMs: 300, randomMargin: 80 },
  medium: { maxDepth: 4, timeLimitMs: 700, randomMargin: 15 },
  hard: { maxDepth: 12, timeLimitMs: 1500, randomMargin: 1 },
  hint: { maxDepth: 12, timeLimitMs: 1000, randomMargin: 0 },
} as const satisfies Record<string, AiPreset>;

export const BOT_TIMING = {
  THINK_DELAY_MS: 700,
  TURBO_THINK_DELAY_MS: 150,
} as const;

export const PERFORMANCE_CONFIG = {
  SAMPLE_INTERVAL_MS: 500,
  DOWNGRADE_BELOW: { high: 40, medium: 20 },
  UPGRADE_ABOVE: { low: 35, medium: 52 },
  DOWNGRADE_SAMPLES: 2,
  UPGRADE_SAMPLES: 8,
} as const;
