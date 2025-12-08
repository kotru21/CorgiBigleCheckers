export { useSmoothValue } from "./hooks/useSmoothValue";
export { usePieceAnimation } from "./hooks/usePieceAnimation";

export { easings, lerp, damp } from "./lib/easings";
export {
  interpolatePosition,
  interpolateJumpPosition,
  calculateProgress,
  boardToWorld,
  generateAnimationId,
  worldToBoard,
} from "./lib/interpolation";

export {
  useAnimationStore,
  ANIMATION_CONFIG,
  ANIMATION_CONFIG_LEGACY,
} from "./store/animationStore";

export type {
  Position3D,
  AnimatingPiece,
  AnimationConfig,
  EasingFunction,
  SmoothValueConfig,
  SmoothValue3DConfig,
} from "./types";
