import { GAME_MODES } from "@shared/config/constants";
import type { SimpleEnvironmentProps } from "../types";

export function SimpleEnvironment({ gameMode }: SimpleEnvironmentProps) {
  if (gameMode === GAME_MODES.PARTY_MODE) {
    return (
      <>
        <ambientLight intensity={0.3} color="#1a1a2e" />
        <directionalLight
          position={[5, 10, 5]}
          intensity={0.4}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={15}
          color="#7c7ce0"
        />
        <pointLight position={[8, 15, 8]} intensity={0.8} color="#e6e6fa" />
        <pointLight position={[-8, 8, -8]} intensity={0.4} color="#4b0082" />
        <pointLight position={[8, 8, -8]} intensity={0.4} color="#8a2be2" />
      </>
    );
  }

  return (
    <>
      <ambientLight intensity={0.5} color="#ffffff" />
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={15}
        color="#ffffff"
      />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#f0f8ff" />
    </>
  );
}
