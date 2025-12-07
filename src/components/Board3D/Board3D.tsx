import {
  Suspense,
  useState,
  useMemo,
  useCallback,
  type ReactElement,
} from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
} from "@react-three/drei";
import { PieceMesh } from "./PieceMesh";
import { EMPTY, GAME_MODES } from "@shared/config/constants";
import {
  BoardFrame,
  PerformanceMonitor,
  SkyWithCloudsAndSun,
  SimpleEnvironment,
} from "./components";
import { useBoardSquares } from "./hooks";
import * as THREE from "three";
import type {
  Board3DProps,
  Board3DContentProps,
  PerformanceMode,
} from "./types";

function Board3DContent({
  board,
  onPieceSelect,
  selectedPiece,
  validMoves,
  onPerformanceData,
  piecesWithCaptures = [],
  gameMode,
}: Board3DContentProps) {
  const [performanceMode, setPerformanceMode] =
    useState<PerformanceMode>("high");

  const handlePerformanceChange = useCallback(
    (fps: number, mode: PerformanceMode) => {
      setPerformanceMode(mode);
      onPerformanceData(fps, mode);
    },
    [onPerformanceData]
  );

  const { renderBoardSquares } = useBoardSquares({
    selectedPiece,
    validMoves,
    piecesWithCaptures,
    gameMode,
    onPieceSelect,
  });

  const renderPieces = useMemo<ReactElement[]>(
    () =>
      board.flatMap((row, rowIndex) =>
        row.flatMap((cell, colIndex) => {
          if (cell === EMPTY) {
            return [];
          }

          const type = cell.includes("beagle") ? "beagle" : "corgi";
          const isKing = cell.includes("-king");

          return [
            <PieceMesh
              key={`piece-${rowIndex}-${colIndex}`}
              type={type}
              isKing={isKing}
              position={[rowIndex - 4.5, 0, colIndex - 4.5]}
              onClick={() => onPieceSelect(rowIndex, colIndex)}
              isSelected={
                selectedPiece?.row === rowIndex &&
                selectedPiece?.col === colIndex
              }
              gameMode={gameMode}
            />,
          ];
        })
      ),
    [board, selectedPiece, onPieceSelect, gameMode]
  );

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 5, 7]} fov={50} />
      <OrbitControls
        enableZoom
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 6}
        maxDistance={12}
        minDistance={5}
      />
      <SimpleEnvironment gameMode={gameMode} />
      <PerformanceMonitor onPerformanceChange={handlePerformanceChange} />
      <Suspense fallback={null}>
        <BoardFrame
          renderBoardSquares={renderBoardSquares}
          gameMode={gameMode}
        />
        <SkyWithCloudsAndSun
          performanceMode={performanceMode}
          gameMode={gameMode}
        />
        <ContactShadows
          position={[0, -0.5, 0]}
          opacity={0.4}
          width={15}
          height={15}
          blur={1.5}
          far={4.5}
          resolution={256}
        />
        {renderPieces}
      </Suspense>
      <Environment
        preset={gameMode === GAME_MODES.PARTY_MODE ? "night" : "sunset"}
      />
    </>
  );
}

export function Board3D({
  board,
  onPieceSelect,
  selectedPiece,
  validMoves,
  onPerformanceData,
  piecesWithCaptures = [],
  gameMode,
}: Board3DProps) {
  const performanceHandler = onPerformanceData ?? (() => {});

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      performance={{ min: 0.5 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}>
      <Board3DContent
        board={board}
        onPieceSelect={onPieceSelect}
        selectedPiece={selectedPiece}
        validMoves={validMoves}
        onPerformanceData={performanceHandler}
        piecesWithCaptures={piecesWithCaptures}
        gameMode={gameMode}
      />
    </Canvas>
  );
}

export type { Board3DProps, PerformanceMode, CaptureInfo } from "./types";
