import { useMemo } from "react";
import { Cloud, Clouds } from "@react-three/drei";
import type { EnhancedCloudsProps } from "../types";

const randomRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;

export function EnhancedClouds({ count = 16 }: EnhancedCloudsProps) {
  const clouds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + randomRange(-0.2, 0.2);
        const radius = randomRange(40, 75);
        return {
          seed: i + 1,
          position: [
            Math.cos(angle) * radius,
            randomRange(9, 20),
            Math.sin(angle) * radius,
          ] as [number, number, number],
          bounds: [
            randomRange(10, 16),
            randomRange(2, 4),
            randomRange(5, 8),
          ] as [number, number, number],
          segments: Math.round(randomRange(16, 24)),
          volume: randomRange(12, 18),
        };
      }),
    [count]
  );

  return (
    <Clouds texture="/textures/cloud.png" limit={400} frustumCulled={false}>
      {clouds.map((cloud) => (
        <Cloud
          key={cloud.seed}
          seed={cloud.seed}
          position={cloud.position}
          bounds={cloud.bounds}
          segments={cloud.segments}
          volume={cloud.volume}
          growth={6}
          speed={0.06}
          opacity={0.8}
          color="#ffffff"
        />
      ))}
    </Clouds>
  );
}
