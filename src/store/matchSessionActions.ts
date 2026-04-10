import type { GameMode } from "@shared/types/game.types";
import { useAnimationStore } from "../features/animation";
import { useGameStore } from "./gameStore";

/** Сброс анимаций фигур + новая партия в текущем режиме (HUD, GameControls). */
export function restartMatchFromUI(): void {
  useAnimationStore.getState().clearAllAnimations();
  useGameStore.getState().restartMatch();
}

/** Сброс анимаций + старт партии в выбранном режиме (меню, селектор режима). */
export function beginMatchFromUI(mode: GameMode): void {
  useAnimationStore.getState().clearAllAnimations();
  useGameStore.getState().beginMatch(mode);
}
