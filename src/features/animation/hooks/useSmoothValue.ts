import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { damp } from "../lib/easings";
import type { SmoothValueConfig } from "../types";

interface UseSmoothValueResult {
  valueRef: React.MutableRefObject<number>;
  setTarget: (value: number) => void;
  getTarget: () => number;
  reset: (value?: number) => void;
}

export function useSmoothValue(
  config: SmoothValueConfig = {}
): UseSmoothValueResult {
  const { initial = 0, speed = 10, threshold = 0.001 } = config;

  const valueRef = useRef(initial);
  const targetRef = useRef(initial);

  useFrame((_, delta) => {
    const diff = targetRef.current - valueRef.current;

    if (Math.abs(diff) > threshold) {
      valueRef.current = damp(
        valueRef.current,
        targetRef.current,
        speed,
        delta
      );
    } else {
      valueRef.current = targetRef.current;
    }
  });

  const setTarget = (value: number) => {
    targetRef.current = value;
  };

  const getTarget = () => targetRef.current;

  const reset = (value: number = initial) => {
    valueRef.current = value;
    targetRef.current = value;
  };

  return {
    valueRef,
    setTarget,
    getTarget,
    reset,
  };
}
