import { useState, useCallback, useEffect, type ReactElement } from "react";
import { useTexture } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { GAME_MODES } from "@shared/config/constants";
import * as THREE from "three";
import type { Position, Move, GameMode } from "@shared/types/game.types";
import type { CaptureInfo, BoardRenderer } from "../types";

interface UseBoardSquaresParams {
  selectedPiece: Position | null;
  validMoves: Move[];
  piecesWithCaptures: CaptureInfo[];
  gameMode: GameMode;
  onPieceSelect: (row: number, col: number) => void;
}

export function useBoardSquares({
  selectedPiece,
  validMoves,
  piecesWithCaptures,
  gameMode,
  onPieceSelect,
}: UseBoardSquaresParams): {
  renderBoardSquares: BoardRenderer;
  hoveredSquare: Position | null;
} {
  const [hoveredSquare, setHoveredSquare] = useState<Position | null>(null);

  const darkSquareTexture = useTexture(
    "/textures/dark_square.jpg"
  ) as THREE.Texture;
  const lightSquareTexture = useTexture(
    "/textures/light_square.jpg"
  ) as THREE.Texture;

  useEffect(() => {
    [darkSquareTexture, lightSquareTexture].forEach((texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);
    });
  }, [darkSquareTexture, lightSquareTexture]);

  const renderBoardSquares: BoardRenderer = useCallback(() => {
    const squares: ReactElement[] = [];

    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const isEven = (row + col) % 2 === 0;
        const isDarkSquare = !isEven;
        const isSelected =
          selectedPiece?.row === row && selectedPiece?.col === col;
        const isValidMove = validMoves?.some(
          (move) => move.row === row && move.col === col
        );
        const isHovered =
          hoveredSquare?.row === row && hoveredSquare?.col === col;

        const hasCapturePiece = piecesWithCaptures.some(
          (piece) => piece.row === row && piece.col === col
        );

        const material = new THREE.MeshStandardMaterial({
          map: isEven ? lightSquareTexture : darkSquareTexture,
          color: isEven ? "#E8D0AA" : "#774936",
          roughness: 0.7,
          metalness: 0.05,
        });

        if (gameMode === GAME_MODES.PARTY_MODE) {
          material.metalness = 0.8;
          material.roughness = 0.05;

          const time = Date.now() * 0.003;
          const pulseIntensity =
            0.6 + Math.sin(time + row * 0.7 + col * 0.7) * 0.4;

          if (isEven) {
            material.emissive = new THREE.Color("#ff8040");
            material.emissiveIntensity = pulseIntensity * 1.2;
          } else {
            material.emissive = new THREE.Color("#4080ff");
            material.emissiveIntensity = pulseIntensity * 1.5;
          }
        }

        if (isSelected) {
          material.color.set("#66BB66");
          if (gameMode === GAME_MODES.PARTY_MODE) {
            material.emissive.set("#00ff00");
            material.emissiveIntensity = 0.8;
          }
        } else if (isValidMove) {
          material.color.set("#6699FF");
          material.transparent = true;
          material.opacity = 0.9;
          if (gameMode === GAME_MODES.PARTY_MODE) {
            material.emissive.set("#0066ff");
            material.emissiveIntensity = 0.6;
          }
        } else if (hasCapturePiece) {
          material.color.set("#FF6666");
          material.transparent = true;
          material.opacity = 0.8;
          if (gameMode === GAME_MODES.PARTY_MODE) {
            material.emissive.set("#ff0000");
            material.emissiveIntensity = 0.7;
          }
        } else if (isHovered) {
          material.color.set(isEven ? "#F0DDB8" : "#8A5A44");
          if (gameMode === GAME_MODES.PARTY_MODE) {
            material.emissive.set("#ffff00");
            material.emissiveIntensity = 0.4;
          }
        }

        squares.push(
          <mesh
            key={`square-${row}-${col}`}
            position={[row - 4.5, -0.097, col - 4.5]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
            onClick={(event: ThreeEvent<MouseEvent>) => {
              event.stopPropagation();
              if (isDarkSquare) {
                onPieceSelect(row, col);
              }
            }}
            onPointerOver={(event: ThreeEvent<PointerEvent>) => {
              event.stopPropagation();
              setHoveredSquare({ row, col });
            }}
            onPointerOut={(event: ThreeEvent<PointerEvent>) => {
              event.stopPropagation();
              setHoveredSquare(null);
            }}>
            <planeGeometry args={[0.95, 0.95]} />
            <primitive object={material} attach="material" />
          </mesh>
        );

        squares.push(
          <mesh
            key={`border-${row}-${col}`}
            position={[row - 4.5, -0.096, col - 4.5]}
            rotation={[-Math.PI / 2, 0, 0]}>
            <meshBasicMaterial
              color={isEven ? "#774936" : "#E8D0AA"}
              opacity={0.3}
              transparent
            />
          </mesh>
        );
      }
    }

    return squares;
  }, [
    darkSquareTexture,
    lightSquareTexture,
    selectedPiece,
    validMoves,
    hoveredSquare,
    piecesWithCaptures,
    gameMode,
    onPieceSelect,
  ]);

  return { renderBoardSquares, hoveredSquare };
}
