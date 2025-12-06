import { useState, useEffect } from "react";

export function usePieceAnimations(isSelected: boolean) {
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [currentHeight, setCurrentHeight] = useState<number>(0);

  useEffect(() => {
    setTargetHeight(isSelected ? 0.3 : 0);
  }, [isSelected]);

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      setCurrentHeight((prev) => prev + (targetHeight - prev) * 0.1);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [targetHeight, currentHeight]);

  return { currentHeight, animateHeight: setTargetHeight };
}
