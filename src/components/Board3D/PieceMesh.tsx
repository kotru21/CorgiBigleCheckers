import { useMemo, useRef, useState } from "react";
import { type ThreeEvent } from "@react-three/fiber";
import { usePieceAnimation } from "../../features/animation";
import { useGLTF, Sparkles } from "@react-three/drei";
import { GAME_MODES } from "@shared/config/constants";
import * as THREE from "three";
import type { GameMode } from "@shared/types/game.types";

type PieceKind = "beagle" | "corgi";

type GLTFResult = { scene: THREE.Group };

const beagleMaterial = new THREE.MeshStandardMaterial({
  color: "#FFD700",
  roughness: 0.4,
  metalness: 0.3,
});

const corgiMaterial = new THREE.MeshStandardMaterial({
  color: "#FF8C00",
  roughness: 0.4,
  metalness: 0.3,
});

const crownMaterial = new THREE.MeshStandardMaterial({
  color: "#FFD700",
  roughness: 0.2,
  metalness: 0.8,
});

interface PieceMeshProps {
  type: PieceKind;
  boardRow: number;
  boardCol: number;
  isKing: boolean;
  onClick: () => void;
  isSelected: boolean;
  gameMode: GameMode;
  animationId?: string | null;
}

export function PieceMesh({
  type,
  boardRow,
  boardCol,
  isKing,
  onClick,
  isSelected,
  gameMode,
  animationId,
}: PieceMeshProps) {
  const groupRef = useRef<THREE.Group | null>(null);
  const [hovered, setHovered] = useState(false);

  // Используем комплексную систему анимаций
  const { isMoving } = usePieceAnimation({
    boardRow,
    boardCol,
    isSelected,
    isHovered: hovered,
    animationId,
    groupRef,
    pieceType: type,
  });

  const { scene: pieceScene } = useGLTF(`/models/${type}.glb`) as GLTFResult;
  const { scene: crownScene } = useGLTF("/models/crown.glb") as GLTFResult;

  const pieceModel = useMemo(() => {
    const clone = pieceScene.clone();
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.material = type === "beagle" ? beagleMaterial : corgiMaterial;
      }
    });
    return clone;
  }, [pieceScene, type]);

  const crownModel = useMemo(() => {
    const clone = crownScene.clone();
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.material = crownMaterial;
      }
    });
    return clone;
  }, [crownScene]);

  // Все анимации теперь управляются в usePieceAnimation

  const scale = type === "corgi" ? 0.4 : 0.43;

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();

    // Не позволяем кликать во время анимации
    if (isMoving) {
      return;
    }

    if (type === "beagle") {
      onClick();
    }
  };

  const modelRotation: [number, number, number] =
    type === "beagle" ? [0, 11, 0] : [0, 0, 0];

  return (
    <group
      ref={groupRef}
      scale={hovered && type === "beagle" ? scale * 1.1 : scale}>
      <mesh
        onClick={handleClick}
        onPointerOver={(event) => {
          event.stopPropagation();
          if (type === "beagle" && !isMoving) {
            setHovered(true);
          }
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          setHovered(false);
        }}
        visible={false}>
        <boxGeometry args={[0.8, 1, 0.8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <primitive
        object={pieceModel}
        position={[0, -0.1, 0]}
        rotation={modelRotation}
        scale={3}
      />

      {isKing && (
        <primitive
          object={crownModel}
          position={[0, 2, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={0.03}
        />
      )}

      {(isSelected || hovered) && type === "beagle" && (
        <pointLight
          position={[0, 0.5, 0]}
          intensity={isSelected ? 0.4 : 0.2}
          color="#FFD700"
          distance={1}
        />
      )}

      {gameMode === GAME_MODES.PARTY_MODE && (isSelected || hovered) && (
        <>
          <pointLight
            position={[0, 0.8, 0]}
            intensity={0.4}
            color={type === "beagle" ? "#00BFFF" : "#FF69B4"}
            distance={1.8}
          />
          <Sparkles
            count={type === "beagle" ? 40 : 25}
            speed={1.2}
            size={2.4}
            color={type === "beagle" ? "#00BFFF" : "#FF69B4"}
            opacity={0.6}
            scale={[1.1, 1.1, 1.1]}
          />
        </>
      )}
    </group>
  );
}

useGLTF.preload("/models/beagle.glb");
useGLTF.preload("/models/corgi.glb");
useGLTF.preload("/models/crown.glb");
