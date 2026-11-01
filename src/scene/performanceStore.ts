import { create } from "zustand";
import { PERFORMANCE_CONFIG } from "@/shared/config/constants";

export type PerformanceMode = "high" | "medium" | "low";

export interface PerformanceStreak {
  direction: "down" | "up" | null;
  count: number;
}

const LOWER: Record<PerformanceMode, number> = {
  high: PERFORMANCE_CONFIG.DOWNGRADE_BELOW.high,
  medium: PERFORMANCE_CONFIG.DOWNGRADE_BELOW.medium,
  low: -Infinity,
};

const UPPER: Record<PerformanceMode, number> = {
  high: Infinity,
  medium: PERFORMANCE_CONFIG.UPGRADE_ABOVE.medium,
  low: PERFORMANCE_CONFIG.UPGRADE_ABOVE.low,
};

const DOWN: Record<PerformanceMode, PerformanceMode> = {
  high: "medium",
  medium: "low",
  low: "low",
};

const UP: Record<PerformanceMode, PerformanceMode> = {
  high: "high",
  medium: "high",
  low: "medium",
};

export function nextPerformanceMode(
  mode: PerformanceMode,
  fps: number,
  streak: PerformanceStreak
): { mode: PerformanceMode; streak: PerformanceStreak } {
  const direction =
    fps < LOWER[mode] ? "down" : fps > UPPER[mode] ? "up" : null;
  if (direction === null) {
    return { mode, streak: { direction: null, count: 0 } };
  }

  const count = streak.direction === direction ? streak.count + 1 : 1;
  const needed =
    direction === "down"
      ? PERFORMANCE_CONFIG.DOWNGRADE_SAMPLES
      : PERFORMANCE_CONFIG.UPGRADE_SAMPLES;
  if (count >= needed) {
    return {
      mode: direction === "down" ? DOWN[mode] : UP[mode],
      streak: { direction: null, count: 0 },
    };
  }
  return { mode, streak: { direction, count } };
}

interface PerformanceStore {
  fps: number;
  mode: PerformanceMode;
  streak: PerformanceStreak;
  reportSample: (fps: number) => void;
}

export const usePerformanceStore = create<PerformanceStore>((set, get) => ({
  fps: 60,
  mode: "high",
  streak: { direction: null, count: 0 },

  reportSample: (fps) => {
    const { mode, streak } = nextPerformanceMode(get().mode, fps, get().streak);
    set({ fps, mode, streak });
  },
}));
