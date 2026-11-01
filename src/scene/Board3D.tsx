import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";
import { GAME_MODES } from "@/shared/config/constants";
import { useAnimationStore } from "@/match/animationStore";
import { usePerformanceStore } from "./performanceStore";
import { PieceMesh } from "./PieceMesh";
import { buildPieceDescriptors } from "./buildPieceDescriptors";
import { BoardFrame } from "./BoardFrame";
import { BoardSquares } from "./BoardSquares";
import { PerformanceMonitor } from "./PerformanceMonitor";
import { SkyWithCloudsAndSun } from "./environment/SkyWithCloudsAndSun";
import { SimpleEnvironment } from "./environment/SimpleEnvironment";
import type { BoardViewProps } from "./types";

function Board3DContent({
  board,
  gameMode,
  overlay,
  controllableSide,
  onSquareSelect,
}: BoardViewProps) {
  const performanceMode = usePerformanceStore((s) => s.mode);
  const activeMove = useAnimationStore((s) => s.activeMove);
  const size = board.length;

  const pieceDescriptors = useMemo(
    () => buildPieceDescriptors(board, activeMove, controllableSide),
    [board, activeMove, controllableSide]
  );
  const { selectedPiece } = overlay;

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
      <PerformanceMonitor />
      <Suspense fallback={null}>
        <BoardFrame size={size} gameMode={gameMode}>
          <BoardSquares
            size={size}
            overlay={overlay}
            gameMode={gameMode}
            onSquareSelect={onSquareSelect}
          />
        </BoardFrame>
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
        {pieceDescriptors.map((d) => (
          <PieceMesh
            key={d.key}
            type={d.type}
            isKing={d.isKing}
            boardRow={d.boardRow}
            boardCol={d.boardCol}
            boardSize={size}
            onClick={() => onSquareSelect(d.boardRow, d.boardCol)}
            isSelected={
              selectedPiece?.row === d.boardRow &&
              selectedPiece?.col === d.boardCol
            }
            gameMode={gameMode}
            animationId={d.animationId}
            pointerTarget={d.pointerTarget}
          />
        ))}
      </Suspense>
      <Environment
        preset={gameMode === GAME_MODES.PARTY_MODE ? "night" : "sunset"}
      />
    </>
  );
}

export function Board3D(props: BoardViewProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      performance={{ min: 0.5 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFShadowMap;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}>
      <Board3DContent {...props} />
    </Canvas>
  );
}

export default Board3D;
