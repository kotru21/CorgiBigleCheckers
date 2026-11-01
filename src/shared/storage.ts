import { logger } from "./logger";

const PREFIX = "corgi-beagle-checkers:";

const available = () =>
  typeof window !== "undefined" && "localStorage" in window;

export function readStored<T>(
  key: string,
  isValid: (value: unknown) => value is T
): T | null {
  if (!available()) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) {
      return null;
    }
    const value: unknown = JSON.parse(raw);
    return isValid(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: unknown): void {
  if (!available()) {
    return;
  }
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (error) {
    logger.warn(`Не удалось сохранить «${key}»:`, error);
  }
}

export function removeStored(key: string): void {
  if (!available()) {
    return;
  }
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch (error) {
    logger.warn(`Не удалось удалить «${key}»:`, error);
  }
}
