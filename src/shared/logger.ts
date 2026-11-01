/* oxlint-disable no-console */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

type LogLevelValue = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];

class Logger {
  constructor(private level: LogLevelValue) {}

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
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: unknown[]) {
    if (this.level >= LOG_LEVELS.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}

const level =
  import.meta.env.DEV && import.meta.env.MODE !== "test"
    ? LOG_LEVELS.INFO
    : LOG_LEVELS.WARN;

export const logger = new Logger(level);
