import { Sky, Sparkles } from "@react-three/drei";
import { GAME_MODES } from "@shared/config/constants";
import * as THREE from "three";
import { Sun } from "./Sun";
import { EnhancedClouds } from "./EnhancedClouds";
import { EnhancedDiscoBalls } from "./DiscoBall";
import type { SkyWithCloudsAndSunProps } from "../types";

export function SkyWithCloudsAndSun({
  performanceMode,
  gameMode,
}: SkyWithCloudsAndSunProps) {
  if (gameMode === GAME_MODES.PARTY_MODE) {
    return (
      <>
        <mesh position={[0, 0, 0]} scale={500}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color="#0f0f23" side={THREE.BackSide} />
        </mesh>

        <Sparkles
          count={200}
          scale={[400, 400, 400]}
          size={3}
          speed={0.1}
          color="#ffffff"
          opacity={0.8}
        />

        <group position={[80, 80, -80]}>
          <mesh>
            <sphereGeometry args={[8, 32, 32]} />
            <meshBasicMaterial color="#f5f5dc" />
          </mesh>
          <pointLight
            position={[0, 0, 0]}
            intensity={1.5}
            color="#e6e6fa"
            distance={100}
          />
        </group>

        <EnhancedDiscoBalls count={10} />
      </>
    );
  }

  if (performanceMode === "low") {
    return (
      <>
        <mesh position={[0, 0, 0]} scale={500}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="#87CEEB" side={THREE.BackSide} />
        </mesh>

        <directionalLight
          position={[100, 100, -100]}
          intensity={3}
          color="#FFFACD"
          castShadow
        />
      </>
    );
  }

  if (performanceMode === "medium") {
    return (
      <>
        <Sky
          distance={450000}
          sunPosition={[100, 100, -100]}
          inclination={0.6}
          azimuth={0.25}
          rayleigh={0.15}
          turbidity={6}
          mieCoefficient={0.003}
          mieDirectionalG={0.9}
        />
        <Sun />
      </>
    );
  }

  return (
    <>
      <Sky
        distance={450000}
        sunPosition={[100, 100, -100]}
        inclination={0.6}
        azimuth={0.25}
        rayleigh={0.15}
        turbidity={6}
        mieCoefficient={0.003}
        mieDirectionalG={0.9}
      />
      <Sun />
      <EnhancedClouds count={100} />
    </>
  );
}
