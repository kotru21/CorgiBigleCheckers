import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { GAME_MODES } from "@/shared/config/constants";
import type { Position } from "@/shared/types/game.types";
import { getSquareInteractionFlags } from "@/match/squareVisualState";
import type { BoardSquaresProps } from "./types";

const COLORS = {
  light: "#E8D0AA",
  dark: "#774936",
  selected: "#66BB66",
  validMove: "#6699FF",
  pendingCapture: "#E0A030",
  capturePiece: "#FF6666",
  hoveredLight: "#F0DDB8",
  hoveredDark: "#8A5A44",
  lastMove: "#9C7B4B",
  hint: "#3FBF7F",
  cursor: "#F5C542",
} as const;

const PARTY_GLOW = {
  light: { color: "#ff8040", pulse: 1.2 },
  dark: { color: "#4080ff", pulse: 1.5 },
  selected: { color: "#00ff00", intensity: 0.8 },
  validMove: { color: "#0066ff", intensity: 0.6 },
  pendingCapture: { color: "#ff8800", intensity: 0.7 },
  capturePiece: { color: "#ff0000", intensity: 0.7 },
  hovered: { color: "#ffff00", intensity: 0.4 },
  lastMove: { color: "#ffffff", intensity: 0.3 },
  hint: { color: "#00ff88", intensity: 0.7 },
  cursor: { color: "#ffcc00", intensity: 0.8 },
} as const;

type Glow = { color: string; intensity?: number; pulse?: number };

function styleSquare(
  material: THREE.MeshStandardMaterial,
  color: string,
  glow: Glow,
  isParty: boolean
): number {
  material.color.set(color);
  material.roughness = isParty ? 0.05 : 0.7;
  material.metalness = isParty ? 0.8 : 0.05;
  if (!isParty) {
    material.emissive.set("#000000");
    return 0;
  }
  material.emissive.set(glow.color);
  material.emissiveIntensity = glow.intensity ?? 0;
  return glow.pulse ?? 0;
}

function setGlowIntensity(
  material: THREE.MeshStandardMaterial,
  intensity: number
) {
  material.emissiveIntensity = intensity;
}

const toRowCol = (index: number, size: number) => ({
  row: Math.floor(index / size),
  col: index % size,
});

export function BoardSquares({
  size,
  overlay,
  gameMode,
  onSquareSelect,
}: BoardSquaresProps) {
  const squareCount = size * size;
  const offset = (size - 1) / 2;
  const darkTexture = useTexture("/textures/dark_square.jpg");
  const lightTexture = useTexture("/textures/light_square.jpg");

  const geometry = useMemo(() => new THREE.PlaneGeometry(0.95, 0.95), []);
  const materials = useMemo(
    () =>
      Array.from({ length: squareCount }, (_, index) => {
        const { row, col } = toRowCol(index, size);
        const isDark = (row + col) % 2 === 1;
        return new THREE.MeshStandardMaterial({
          map: isDark ? darkTexture : lightTexture,
        });
      }),
    [darkTexture, lightTexture, squareCount, size]
  );

  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry]
  );
  useEffect(
    () => () => {
      for (const material of materials) {
        material.dispose();
      }
    },
    [materials]
  );

  const overlayRef = useRef(overlay);
  const selectRef = useRef(onSquareSelect);
  const hoveredRef = useRef<Position | null>(null);
  const pulseRef = useRef(new Float32Array(100));
  useLayoutEffect(() => {
    overlayRef.current = overlay;
    selectRef.current = onSquareSelect;
  });

  const isParty = gameMode === GAME_MODES.PARTY_MODE;

  const paint = useMemo(
    () => (index: number) => {
      const { row, col } = toRowCol(index, size);
      const flags = getSquareInteractionFlags(row, col, {
        ...overlayRef.current,
        hoveredSquare: hoveredRef.current,
      });
      const isLight = !flags.isDarkSquare;

      let color: string = isLight ? COLORS.light : COLORS.dark;
      let glow: Glow = isLight ? PARTY_GLOW.light : PARTY_GLOW.dark;
      if (flags.isCursor) {
        color = COLORS.cursor;
        glow = PARTY_GLOW.cursor;
      } else if (flags.isSelected) {
        color = COLORS.selected;
        glow = PARTY_GLOW.selected;
      } else if (flags.isValidMove) {
        color = COLORS.validMove;
        glow = PARTY_GLOW.validMove;
      } else if (flags.isHint) {
        color = COLORS.hint;
        glow = PARTY_GLOW.hint;
      } else if (flags.isPendingCapture) {
        color = COLORS.pendingCapture;
        glow = PARTY_GLOW.pendingCapture;
      } else if (flags.hasCapturePiece) {
        color = COLORS.capturePiece;
        glow = PARTY_GLOW.capturePiece;
      } else if (flags.isHovered) {
        color = isLight ? COLORS.hoveredLight : COLORS.hoveredDark;
        glow = PARTY_GLOW.hovered;
      } else if (flags.isLastMove) {
        color = COLORS.lastMove;
        glow = PARTY_GLOW.lastMove;
      }

      pulseRef.current[index] = styleSquare(
        materials[index],
        color,
        glow,
        isParty
      );
    },
    [materials, isParty, size]
  );

  const {
    selectedPiece,
    validMoves,
    piecesWithCaptures,
    pendingCaptures,
    lastMoveSquares,
    hintSquares,
    cursor,
  } = overlay;
  useEffect(() => {
    for (let i = 0; i < squareCount; i++) {
      paint(i);
    }
  }, [
    paint,
    squareCount,
    selectedPiece,
    validMoves,
    piecesWithCaptures,
    pendingCaptures,
    lastMoveSquares,
    hintSquares,
    cursor,
  ]);

  useFrame(({ clock }) => {
    if (!isParty) {
      return;
    }
    const time = clock.elapsedTime * 3;
    const pulse = pulseRef.current;
    for (let i = 0; i < squareCount; i++) {
      if (pulse[i] > 0) {
        const { row, col } = toRowCol(i, size);
        setGlowIntensity(
          materials[i],
          (0.6 + Math.sin(time + row * 0.7 + col * 0.7) * 0.4) * pulse[i]
        );
      }
    }
  });

  const squares = useMemo(
    () =>
      materials.map((material, index) => {
        const { row, col } = toRowCol(index, size);
        const isDark = (row + col) % 2 === 1;
        const setHover = (square: Position | null) => {
          const previous = hoveredRef.current;
          hoveredRef.current = square;
          if (previous) {
            paint(previous.row * size + previous.col);
          }
          paint(index);
        };
        return (
          <mesh
            key={index}
            geometry={geometry}
            material={material}
            position={[row - offset, -0.097, col - offset]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
            {...(isDark && {
              onClick: (event: ThreeEvent<MouseEvent>) => {
                event.stopPropagation();
                selectRef.current(row, col);
              },
              onPointerOver: (event: ThreeEvent<PointerEvent>) => {
                event.stopPropagation();
                setHover({ row, col });
              },
              onPointerOut: (event: ThreeEvent<PointerEvent>) => {
                event.stopPropagation();
                if (
                  hoveredRef.current?.row === row &&
                  hoveredRef.current?.col === col
                ) {
                  setHover(null);
                }
              },
            })}
          />
        );
      }),
    [materials, geometry, paint, size, offset]
  );

  return <group>{squares}</group>;
}
