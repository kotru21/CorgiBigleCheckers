import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PERFORMANCE_CONFIG } from "@/shared/config/constants";
import { usePerformanceStore } from "./performanceStore";

export function PerformanceMonitor() {
  const frameCount = useRef(0);
  const lastTime = useRef<number | null>(null);

  useFrame(() => {
    const now = performance.now();
    if (lastTime.current === null) {
      lastTime.current = now;
      return;
    }
    frameCount.current++;

    const elapsed = now - lastTime.current;
    if (elapsed >= PERFORMANCE_CONFIG.SAMPLE_INTERVAL_MS) {
      const fps = Math.round((frameCount.current / elapsed) * 1000);
      usePerformanceStore.getState().reportSample(fps);
      frameCount.current = 0;
      lastTime.current = now;
    }
  });

  return null;
}
