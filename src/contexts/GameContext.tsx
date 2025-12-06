import type { ReactNode } from "react";
import { useGameStore, type GameStore } from "../store/gameStore";

export type { GameStore };

// Правильная перегрузка хука без условного вызова
export function useGame(): GameStore;
export function useGame<T>(selector: (state: GameStore) => T): T;
export function useGame<T>(selector?: (state: GameStore) => T): T | GameStore {
  const store = useGameStore();
  if (selector) {
    return selector(store);
  }
  return store;
}

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  return <>{children}</>;
}
