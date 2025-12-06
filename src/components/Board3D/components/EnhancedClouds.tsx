import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { EnhancedCloudsProps } from "../types";

const randomRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;

interface CloudParticle {
  position: [number, number, number];
  scale: number;
  opacity: number;
}

function SimpleCloud({
  position,
  scale = 1,
  opacity = 0.8,
}: {
  position: [number, number, number];
  scale?: number;
  opacity?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const spheres = useMemo(() => {
    const result: Array<{
      pos: [number, number, number];
      size: number;
    }> = [];

    const numSpheres = Math.floor(randomRange(5, 12));
    for (let i = 0; i < numSpheres; i++) {
      result.push({
        pos: [
          randomRange(-2, 2) * scale,
          randomRange(-0.5, 0.5) * scale,
          randomRange(-1, 1) * scale,
        ],
        size: randomRange(0.8, 2) * scale,
      });
    }
    return result;
  }, [scale]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.x =
        position[0] + Math.sin(state.clock.elapsedTime * 0.1) * 0.5;
      groupRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 0.15) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {spheres.map((sphere, i) => (
        <mesh key={i} position={sphere.pos}>
          <sphereGeometry args={[sphere.size, 8, 8]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={opacity * 0.6}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export function EnhancedClouds({ count = 80 }: EnhancedCloudsProps) {
  const clouds = useMemo(() => {
    const result: CloudParticle[] = [];

    const actualCount = Math.min(count, 30);

    for (let i = 0; i < actualCount; i++) {
      const angle = (i / actualCount) * Math.PI * 2;
      const radius = randomRange(40, 100);

      result.push({
        position: [
          Math.cos(angle) * radius,
          randomRange(15, 40),
          Math.sin(angle) * radius,
        ],
        scale: randomRange(2, 5),
        opacity: randomRange(0.4, 0.7),
      });
    }

    return result;
  }, [count]);

  return (
    <group>
      {clouds.map((cloud, i) => (
        <SimpleCloud
          key={`cloud-${i}`}
          position={cloud.position}
          scale={cloud.scale}
          opacity={cloud.opacity}
        />
      ))}
    </group>
  );
}
