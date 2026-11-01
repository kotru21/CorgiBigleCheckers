import { Sparkles } from "@react-three/drei";
import type { SunProps } from "@/scene/types";

const SUN_POSITION: [number, number, number] = [100, 100, -100];

export function Sun({ performanceMode }: SunProps) {
  if (performanceMode === "low") {
    return (
      <directionalLight
        position={SUN_POSITION}
        intensity={3}
        color="#FFFACD"
        castShadow
      />
    );
  }

  return (
    <group position={SUN_POSITION}>
      <mesh>
        <sphereGeometry args={[15, 32, 32]} />
        <meshBasicMaterial color="#FDB813" />
      </mesh>

      {performanceMode !== "medium" && (
        <Sparkles
          count={50}
          scale={[30, 30, 30]}
          size={6}
          speed={0.3}
          color="#FFFFE0"
          opacity={0.7}
        />
      )}

      <directionalLight
        position={[0, 0, 0]}
        intensity={3}
        color="#FFFACD"
        castShadow
        shadow-mapSize-width={performanceMode === "high" ? 2048 : 1024}
        shadow-mapSize-height={performanceMode === "high" ? 2048 : 1024}
        shadow-camera-far={500}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
    </group>
  );
}
