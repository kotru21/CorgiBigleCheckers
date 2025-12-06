import { useMemo } from "react";
import { Cloud } from "@react-three/drei";
import type { EnhancedCloudsProps } from "../types";

interface CloudConfig {
  args: [number, number, number];
  width: number;
  depth: number;
  segments: number;
  opacity: number;
  speed: number;
  color: string;
}

interface ZoneConfig {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  count: number;
  heightVariation: boolean;
}

const randomRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;
const randomInt = (min: number, max: number) =>
  Math.floor(randomRange(min, max));

const createCloudTypes = (): CloudConfig[] => [
  {
    args: [randomRange(8, 15), randomRange(4, 7), randomRange(2, 4)],
    width: randomRange(50, 700),
    depth: randomRange(2, 4),
    segments: randomInt(15, 25),
    opacity: randomRange(0.7, 0.9),
    speed: randomRange(0.05, 0.15),
    color: "#ffffff",
  },
  {
    args: [randomRange(10, 20), randomRange(2, 4), randomRange(1, 2)],
    width: randomRange(70, 710),
    depth: randomRange(1, 2),
    segments: randomInt(12, 18),
    opacity: randomRange(0.5, 0.7),
    speed: randomRange(0.03, 0.1),
    color: "#f5f5f5",
  },
  {
    args: [randomRange(6, 12), randomRange(1.5, 3), randomRange(0.8, 1.5)],
    width: randomRange(60, 90),
    depth: randomRange(0.8, 1.5),
    segments: randomInt(8, 15),
    opacity: randomRange(0.3, 0.5),
    speed: randomRange(0.08, 0.2),
    color: "#fafafa",
  },
  {
    args: [randomRange(9, 18), randomRange(5, 8), randomRange(2.5, 4)],
    width: randomRange(60, 90),
    depth: randomRange(3, 5),
    segments: randomInt(18, 28),
    opacity: randomRange(0.6, 0.8),
    speed: randomRange(0.04, 0.12),
    color: "#f0f0f0",
  },
];

const createZones = (count: number): ZoneConfig[] => [
  {
    minX: -120,
    maxX: 120,
    minY: -5,
    maxY: 25,
    minZ: 35,
    maxZ: 120,
    count: Math.floor(count * 0.3),
    heightVariation: true,
  },
  {
    minX: -120,
    maxX: 120,
    minY: -5,
    maxY: 25,
    minZ: -120,
    maxZ: -35,
    count: Math.floor(count * 0.3),
    heightVariation: true,
  },
  {
    minX: -120,
    maxX: -35,
    minY: -5,
    maxY: 25,
    minZ: -80,
    maxZ: 80,
    count: Math.floor(count * 0.2),
    heightVariation: true,
  },
  {
    minX: 35,
    maxX: 120,
    minY: -5,
    maxY: 25,
    minZ: -80,
    maxZ: 80,
    count: Math.floor(count * 0.2),
    heightVariation: true,
  },
  {
    minX: -150,
    maxX: 150,
    minY: 30,
    maxY: 60,
    minZ: -150,
    maxZ: 150,
    count: Math.floor(count * 0.3),
    heightVariation: false,
  },
];

export function EnhancedClouds({ count = 80 }: EnhancedCloudsProps) {
  const clouds = useMemo(() => {
    const cloudTypes = createCloudTypes();
    const positions = createZones(count);

    let globalCloudIndex = 0;

    return positions.flatMap((zone, zoneIndex) =>
      Array.from({ length: zone.count }).map((_, i) => {
        const cloudType = cloudTypes[randomInt(0, cloudTypes.length)];
        const y = zone.heightVariation
          ? randomRange(zone.minY, zone.maxY)
          : randomRange(zone.minY, zone.maxY) + Math.sin(i * 0.5) * 5;

        const position: [number, number, number] = [
          randomRange(zone.minX, zone.maxX),
          y,
          randomRange(zone.minZ, zone.maxZ),
        ];

        const distanceFromCenter = Math.sqrt(
          position[0] * position[0] + position[2] * position[2]
        );
        const fadeByDistance = Math.max(0, 1 - distanceFromCenter / 150);
        const opacity = cloudType.opacity * fadeByDistance;
        const width = cloudType.width * (0.7 + Math.random() * 0.6);
        const rotation: [number, number, number] = [
          0,
          randomRange(0, Math.PI * 2),
          0,
        ];
        const uniqueKey = `cloud-zone${zoneIndex}-${i}-${globalCloudIndex++}`;

        return (
          <group key={uniqueKey} position={position} rotation={rotation}>
            <Cloud
              {...({
                opacity,
                speed: cloudType.speed,
                width,
                depth: cloudType.depth,
                segments: cloudType.segments,
                color: cloudType.color,
              } as Record<string, unknown>)}
            />
          </group>
        );
      })
    );
  }, [count]);

  return <group>{clouds}</group>;
}
