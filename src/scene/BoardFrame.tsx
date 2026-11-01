import { useEffect, useMemo, type ReactElement } from "react";
import { useTexture } from "@react-three/drei";
import { GAME_MODES } from "@/shared/config/constants";
import * as THREE from "three";
import type { BoardFrameProps } from "./types";

export function BoardFrame({
  size,
  gameMode,
  children,
}: BoardFrameProps): ReactElement {
  const edge = size / 2 + 0.25;
  const length = size + 1;
  const k = size / 10;
  const woodTextures = useTexture({
    map: "/textures/wood_color.png",
    normalMap: "/textures/wood_normal.png",
    roughnessMap: "/textures/wood_roughness.jpg",
  });

  useEffect(() => {
    Object.values(woodTextures).forEach((texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(4, 4);
    });
  }, [woodTextures]);

  const isParty = gameMode === GAME_MODES.PARTY_MODE;
  const woodMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        ...woodTextures,
        color: "#8B5A2B",
        roughness: isParty ? 0.3 : 0.8,
        metalness: isParty ? 0.6 : 0.1,
        emissive: isParty ? "#8B4513" : "#000000",
        emissiveIntensity: isParty ? 0.4 : 1,
      }),
    [woodTextures, isParty]
  );
  useEffect(() => () => woodMaterial.dispose(), [woodMaterial]);

  return (
    <group>
      <mesh position={[0, -0.1, edge]} receiveShadow castShadow>
        <boxGeometry args={[length, 0.3, 0.5]} />
        <primitive object={woodMaterial} attach="material" />
      </mesh>
      <mesh position={[0, -0.1, -edge]} receiveShadow castShadow>
        <boxGeometry args={[length, 0.3, 0.5]} />
        <primitive object={woodMaterial} attach="material" />
      </mesh>
      <mesh position={[edge, -0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.5, 0.3, length]} />
        <primitive object={woodMaterial} attach="material" />
      </mesh>
      <mesh position={[-edge, -0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.5, 0.3, length]} />
        <primitive object={woodMaterial} attach="material" />
      </mesh>

      {isParty && (
        <>
          <pointLight
            position={[4 * k, -0.2, 4 * k]}
            intensity={1.2}
            color="#ff0080"
            distance={12}
          />
          <pointLight
            position={[-4 * k, -0.2, 4 * k]}
            intensity={1.2}
            color="#00ff80"
            distance={12}
          />
          <pointLight
            position={[4 * k, -0.2, -4 * k]}
            intensity={1.2}
            color="#8000ff"
            distance={12}
          />
          <pointLight
            position={[-4 * k, -0.2, -4 * k]}
            intensity={1.2}
            color="#ff8000"
            distance={12}
          />
          <pointLight
            position={[0, -0.2, 0]}
            intensity={1.0}
            color="#00ffff"
            distance={15}
          />

          <pointLight
            position={[2 * k, -0.1, 2 * k]}
            intensity={0.8}
            color="#ff4080"
            distance={8}
          />
          <pointLight
            position={[-2 * k, -0.1, 2 * k]}
            intensity={0.8}
            color="#40ff80"
            distance={8}
          />
          <pointLight
            position={[2 * k, -0.1, -2 * k]}
            intensity={0.8}
            color="#8040ff"
            distance={8}
          />
          <pointLight
            position={[-2 * k, -0.1, -2 * k]}
            intensity={0.8}
            color="#ff8040"
            distance={8}
          />
        </>
      )}
      {children}
    </group>
  );
}
