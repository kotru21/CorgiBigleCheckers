import { useRef, useCallback } from "react";

/**
 * Повторяет поведение boardCreationRef + setTimeout из GameBoard:
 * игнорирует повторные вызовы, пока не истечёт cooldownMs.
 */
export function useTransientActionLock(cooldownMs: number) {
  const busyRef = useRef(false);

  const runLocked = useCallback(
    (action: () => void) => {
      if (busyRef.current) {
        return;
      }
      busyRef.current = true;
      try {
        action();
      } finally {
        window.setTimeout(() => {
          busyRef.current = false;
        }, cooldownMs);
      }
    },
    [cooldownMs]
  );

  return runLocked;
}
