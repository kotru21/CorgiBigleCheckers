import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import type { DiscoBallProps, EnhancedDiscoBallsProps } from "@/scene/types";

const TILE_MATRICES: THREE.Matrix4[] = [
  ...Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2;
    return new THREE.Matrix4()
      .makeScale(0.15, 0.15, 0.15)
      .setPosition(Math.cos(angle) * 0.9, 0, Math.sin(angle) * 0.9);
  }),
  ...Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    return new THREE.Matrix4()
      .makeScale(0.12, 0.12, 0.12)
      .setPosition(Math.cos(angle) * 0.6, 0.6, Math.sin(angle) * 0.6);
  }),
];

const tileGeometry = new THREE.BoxGeometry(1, 1, 1);
const tileMaterial = new THREE.MeshStandardMaterial({
  color: "#ffffff",
  metalness: 1.0,
  roughness: 0.0,
  emissive: "#404040",
  emissiveIntensity: 0.15,
});

export function DiscoBall({ position, scale = 1 }: DiscoBallProps) {
  const discoBallRef = useRef<THREE.Group | null>(null);
  const tilesRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const tiles = tilesRef.current;
    if (!tiles) {
      return;
    }
    TILE_MATRICES.forEach((matrix, i) => tiles.setMatrixAt(i, matrix));
    tiles.instanceMatrix.needsUpdate = true;
    tiles.computeBoundingSphere();
  }, []);

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

      <instancedMesh
        ref={tilesRef}
        args={[tileGeometry, tileMaterial, TILE_MATRICES.length]}
      />

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
  const discoBalls = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => (
        <DiscoBall
          key={`disco-${index}`}
          position={[
            randomRange(-40, 40),
            randomRange(8, 15),
            randomRange(-40, 40),
          ]}
          scale={randomRange(1.5, 2.5)}
        />
      )),
    [count]
  );

  return <group>{discoBalls}</group>;
}
