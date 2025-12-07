import { useState, useEffect } from "react";

export function usePieceAnimations(isSelected: boolean) {
  const targetHeight = isSelected ? 0.3 : 0;
  const [currentHeight, setCurrentHeight] = useState<number>(0);

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      setCurrentHeight((prev) => prev + (targetHeight - prev) * 0.1);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [targetHeight, currentHeight]);

  return { currentHeight };
}
