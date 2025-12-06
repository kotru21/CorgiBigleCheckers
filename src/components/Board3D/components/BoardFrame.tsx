import { useEffect, type ReactElement } from "react";
import { useTexture } from "@react-three/drei";
import { GAME_MODES } from "@shared/config/constants";
import * as THREE from "three";
import type { BoardProps } from "../types";

export function BoardFrame({
  renderBoardSquares,
  gameMode,
}: BoardProps): ReactElement {
  const woodTextures = useTexture({
    map: "/textures/wood_color.png",
    normalMap: "/textures/wood_normal.png",
    roughnessMap: "/textures/wood_roughness.jpg",
  }) as Record<"map" | "normalMap" | "roughnessMap", THREE.Texture>;

  useEffect(() => {
    Object.values(woodTextures).forEach((texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(4, 4);
    });
  }, [woodTextures]);

  const woodMaterial = new THREE.MeshStandardMaterial({
    ...woodTextures,
    roughness: 0.8,
    metalness: 0.1,
    color: "#8B5A2B",
  });

  if (gameMode === GAME_MODES.PARTY_MODE) {
    woodMaterial.metalness = 0.6;
    woodMaterial.roughness = 0.3;
    woodMaterial.emissive = new THREE.Color("#8B4513");
    woodMaterial.emissiveIntensity = 0.4;
  }

  return (
    <group>
      <mesh position={[0, -0.1, 5.25]} receiveShadow castShadow>
        <boxGeometry args={[11, 0.3, 0.5]} />
        <primitive object={woodMaterial} attach="material" />
      </mesh>
      <mesh position={[0, -0.1, -5.25]} receiveShadow castShadow>
        <boxGeometry args={[11, 0.3, 0.5]} />
        <primitive object={woodMaterial} attach="material" />
      </mesh>
      <mesh position={[5.25, -0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.5, 0.3, 11]} />
        <primitive object={woodMaterial} attach="material" />
      </mesh>
      <mesh position={[-5.25, -0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.5, 0.3, 11]} />
        <primitive object={woodMaterial} attach="material" />
      </mesh>

      {gameMode === GAME_MODES.PARTY_MODE && (
        <>
          <pointLight
            position={[4, -0.2, 4]}
            intensity={1.2}
            color="#ff0080"
            distance={12}
          />
          <pointLight
            position={[-4, -0.2, 4]}
            intensity={1.2}
            color="#00ff80"
            distance={12}
          />
          <pointLight
            position={[4, -0.2, -4]}
            intensity={1.2}
            color="#8000ff"
            distance={12}
          />
          <pointLight
            position={[-4, -0.2, -4]}
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
            position={[2, -0.1, 2]}
            intensity={0.8}
            color="#ff4080"
            distance={8}
          />
          <pointLight
            position={[-2, -0.1, 2]}
            intensity={0.8}
            color="#40ff80"
            distance={8}
          />
          <pointLight
            position={[2, -0.1, -2]}
            intensity={0.8}
            color="#8040ff"
            distance={8}
          />
          <pointLight
            position={[-2, -0.1, -2]}
            intensity={0.8}
            color="#ff8040"
            distance={8}
          />
        </>
      )}
      {renderBoardSquares()}
    </group>
  );
}
