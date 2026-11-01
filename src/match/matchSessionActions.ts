import { useAnimationStore } from "./animationStore";
import { useGameStore } from "./gameStore";
import type { MatchSettings } from "./settings";

const clearAnimations = () => useAnimationStore.getState().clearAllAnimations();

export function restartMatchFromUI(): void {
  clearAnimations();
  useGameStore.getState().restartMatch();
}

export function beginMatchFromUI(settings: MatchSettings): void {
  clearAnimations();
  useGameStore.getState().beginMatch(settings);
}

export function resumeMatchFromUI(): boolean {
  clearAnimations();
  return useGameStore.getState().resumeMatch();
}

export function undoFromUI(): void {
  clearAnimations();
  useGameStore.getState().undo();
}

export function resignFromUI(): void {
  clearAnimations();
  useGameStore.getState().resign();
}
