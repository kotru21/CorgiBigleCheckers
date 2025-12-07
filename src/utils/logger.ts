const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

type LogLevelKey = keyof typeof LOG_LEVELS;

type LogLevelValue = (typeof LOG_LEVELS)[LogLevelKey];

class Logger {
  constructor(private level: LogLevelValue = LOG_LEVELS.INFO) {}

  error(message: string, ...args: unknown[]) {
    if (this.level >= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]) {
    if (this.level >= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]) {
    if (this.level >= LOG_LEVELS.INFO) {
      console.warn(`[INFO] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: unknown[]) {
    if (this.level >= LOG_LEVELS.DEBUG) {
      console.warn(`[DEBUG] ${message}`, ...args);
    }
  }
}

export const logger = new Logger(LOG_LEVELS.INFO);
export { LOG_LEVELS };
