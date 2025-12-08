export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface AnimatingPiece {
  id: string;
  from: Position3D;
  to: Position3D;
  startTime: number;
  duration: number;
  isCapture: boolean;
  onComplete?: () => void;
}

export interface AnimationConfig {
  moveDuration: number;
  captureDuration: number;
  jumpHeight: number;
  selectionHeight: number;
  hoverHeight: number;
  smoothSpeed: number;
}

export type EasingFunction = (t: number) => number;

export interface SmoothValueConfig {
  initial?: number;
  speed?: number;
  threshold?: number;
}

export interface SmoothValue3DConfig {
  initial?: Position3D;
  speed?: number;
  threshold?: number;
}
