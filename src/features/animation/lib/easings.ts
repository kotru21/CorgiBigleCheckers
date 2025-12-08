import type { EasingFunction } from "../types";

export const easings = {
  linear: (t: number): number => t,
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

  easeOutBack: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  easeOutBounce: (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },

  easeOutQuad: (t: number): number => 1 - (1 - t) * (1 - t),
  easeInOutSine: (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2,
  easeOutExpo: (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
} as const;

/** Linear interpolation */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/** Frame-rate independent smooth interpolation */
export function damp(
  current: number,
  target: number,
  speed: number,
  delta: number
): number {
  const factor = 1 - Math.exp(-speed * delta);
  return current + (target - current) * factor;
}

export function dampWithEasing(
  current: number,
  target: number,
  speed: number,
  delta: number,
  easing: EasingFunction = easings.easeOutCubic
): number {
  const diff = target - current;
  const absDiff = Math.abs(diff);
  const normalizedProgress = 1 - Math.min(1, absDiff);
  const easedSpeed = speed * (1 + easing(normalizedProgress));

  return damp(current, target, easedSpeed, delta);
}
