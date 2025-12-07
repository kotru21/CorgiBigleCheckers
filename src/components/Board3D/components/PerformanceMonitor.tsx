import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { PerformanceMode, PerformanceMonitorProps } from "../types";

export function PerformanceMonitor({
  onPerformanceChange,
}: PerformanceMonitorProps) {
  const frameCount = useRef(0);
  const lastTime = useRef(0);
  const fps = useRef(60);

  useEffect(() => {
    lastTime.current = performance.now();
  }, []);

  useFrame(() => {
    frameCount.current++;

    const now = performance.now();
    const elapsed = now - lastTime.current;

    if (elapsed > 500) {
      fps.current = Math.round((frameCount.current / elapsed) * 1000);

      let newMode: PerformanceMode = "high";
      if (fps.current < 20) {
        newMode = "low";
      } else if (fps.current < 40) {
        newMode = "medium";
      }

      onPerformanceChange(fps.current, newMode);

      frameCount.current = 0;
      lastTime.current = now;
    }
  });

  return null;
}
