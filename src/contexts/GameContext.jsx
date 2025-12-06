import React from "react";
import { useGameStore } from "../store/gameStore";

// Совместимый API: useGame возвращает Zustand store (рекомендуется селектор)
export function useGame(selector) {
  return selector ? useGameStore(selector) : useGameStore();
}

// Провайдер прозрачный — оставлен для совместимости
export function GameProvider({ children }) {
  return <>{children}</>;
}
