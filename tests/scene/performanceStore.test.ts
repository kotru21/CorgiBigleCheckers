import { describe, expect, it } from "vitest";
import { PERFORMANCE_CONFIG } from "@/shared/config/constants";
import {
  nextPerformanceMode,
  type PerformanceMode,
  type PerformanceStreak,
} from "@/scene/performanceStore";

function feed(mode: PerformanceMode, samples: number[]) {
  let streak: PerformanceStreak = { direction: null, count: 0 };
  const modes: PerformanceMode[] = [];
  for (const fps of samples) {
    ({ mode, streak } = nextPerformanceMode(mode, fps, streak));
    modes.push(mode);
  }
  return modes;
}

describe("nextPerformanceMode", () => {
  it("one bad sample does not lower the quality", () => {
    expect(feed("high", [25, 60, 25, 60])).toEqual([
      "high",
      "high",
      "high",
      "high",
    ]);
  });

  it("lowers after consecutive bad samples", () => {
    const bad = Array(PERFORMANCE_CONFIG.DOWNGRADE_SAMPLES).fill(30);
    expect(feed("high", bad).at(-1)).toBe("medium");
  });

  it("goes back up only after a long stable run", () => {
    const almost = Array(PERFORMANCE_CONFIG.UPGRADE_SAMPLES - 1).fill(60);
    expect(feed("medium", almost).at(-1)).toBe("medium");
    expect(feed("medium", [...almost, 60]).at(-1)).toBe("high");
  });

  it("fps between the thresholds keeps the mode", () => {
    expect(feed("medium", Array(20).fill(45)).at(-1)).toBe("medium");
  });
});
