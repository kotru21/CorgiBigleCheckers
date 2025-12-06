import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import type * as THREE from "three";
import type { DiscoBallProps, EnhancedDiscoBallsProps } from "../types";

export function DiscoBall({ position, scale = 1 }: DiscoBallProps) {
  const discoBallRef = useRef<THREE.Group | null>(null);

  useFrame((_, delta) => {
    if (discoBallRef.current) {
      discoBallRef.current.rotation.y += delta * 0.3;
      discoBallRef.current.rotation.x += delta * 0.1;
    }
  });

  return (
    <group ref={discoBallRef} position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[1.2, 20, 20]} />
        <meshStandardMaterial
          color="#f5f5f5"
          metalness={0.9}
          roughness={0.1}
          envMapIntensity={1.5}
        />
      </mesh>

      {[...Array(16)].map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const x = Math.cos(angle) * 0.9;
        const z = Math.sin(angle) * 0.9;
        return (
          <mesh key={i} position={[x, 0, z]}>
            <boxGeometry args={[0.15, 0.15, 0.15]} />
            <meshStandardMaterial
              color="#ffffff"
              metalness={1.0}
              roughness={0.0}
              emissive="#404040"
              emissiveIntensity={0.2}
            />
          </mesh>
        );
      })}

      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * 0.6;
        const z = Math.sin(angle) * 0.6;
        return (
          <mesh key={`top-${i}`} position={[x, 0.6, z]}>
            <boxGeometry args={[0.12, 0.12, 0.12]} />
            <meshStandardMaterial
              color="#ffffff"
              metalness={1.0}
              roughness={0.0}
              emissive="#202020"
              emissiveIntensity={0.1}
            />
          </mesh>
        );
      })}

      <Sparkles
        count={25}
        scale={[14, 14, 14]}
        size={56}
        speed={0.01}
        color="#ffffff"
        opacity={0.9}
      />
    </group>
  );
}

const randomRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;

export function EnhancedDiscoBalls({ count = 8 }: EnhancedDiscoBallsProps) {
  const discoBalls = useMemo(() => {
    const positions: Array<[number, number, number]> = [];

    for (let i = 0; i < count; i++) {
      positions.push([
        randomRange(-40, 40),
        randomRange(8, 15),
        randomRange(-40, 40),
      ]);
    }

    return positions.map((position, index) => (
      <DiscoBall
        key={`disco-${index}`}
        position={position}
        scale={randomRange(1.5, 2.5)}
      />
    ));
  }, [count]);

  return <group>{discoBalls}</group>;
}
