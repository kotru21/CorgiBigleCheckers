import type { Position3D, EasingFunction } from "./types";
import { easings } from "./easings";

export function interpolatePosition(
  from: Position3D,
  to: Position3D,
  progress: number,
  easing: EasingFunction = easings.easeOutCubic
): Position3D {
  const easedProgress = easing(Math.min(1, Math.max(0, progress)));

  return {
    x: from.x + (to.x - from.x) * easedProgress,
    y: from.y + (to.y - from.y) * easedProgress,
    z: from.z + (to.z - from.z) * easedProgress,
  };
}

export function interpolateJumpPosition(
  from: Position3D,
  to: Position3D,
  progress: number,
  jumpHeight: number = 0.8,
  easing: EasingFunction = easings.easeInOutCubic
): Position3D {
  const easedProgress = easing(Math.min(1, Math.max(0, progress)));

  const x = from.x + (to.x - from.x) * easedProgress;
  const z = from.z + (to.z - from.z) * easedProgress;

  const parabolicHeight =
    -4 * jumpHeight * Math.pow(easedProgress - 0.5, 2) + jumpHeight;
  const baseY = from.y + (to.y - from.y) * easedProgress;
  const y = baseY + Math.max(0, parabolicHeight);

  return { x, y, z };
}

export function calculateProgress(
  startTime: number,
  duration: number,
  currentTime: number
): number {
  const elapsed = currentTime - startTime;
  return Math.min(1, Math.max(0, elapsed / duration));
}

export function boardToWorld(
  row: number,
  col: number,
  size: number,
  y: number = 0
): Position3D {
  const offset = (size - 1) / 2;
  return { x: row - offset, y, z: col - offset };
}
