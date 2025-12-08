import type { ReactElement } from "react";
import type { Board, GameMode, Move, Position } from "@shared/types/game.types";

export type PerformanceMode = "high" | "medium" | "low";

export interface CaptureInfo {
  row: number;
  col: number;
  captures: Move[];
}

export type BoardRenderer = () => ReactElement[];

export interface BoardProps {
  renderBoardSquares: BoardRenderer;
  gameMode: GameMode;
}

export interface SkyWithCloudsAndSunProps {
  performanceMode: PerformanceMode;
  gameMode: GameMode;
}

export interface PieceAnimationInfo {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  animationId: string;
}

export interface Board3DContentProps {
  board: Board;
  onPieceSelect: (row: number, col: number) => void;
  selectedPiece: Position | null;
  validMoves: Move[];
  onPerformanceData: (fps: number, mode: PerformanceMode) => void;
  piecesWithCaptures?: CaptureInfo[];
  gameMode: GameMode;
  currentAnimation?: PieceAnimationInfo | null | undefined;
}

export interface Board3DProps {
  board: Board;
  onPieceSelect: (row: number, col: number) => void;
  selectedPiece: Position | null;
  validMoves: Move[];
  onPerformanceData?: (fps: number, mode: PerformanceMode) => void;
  piecesWithCaptures?: CaptureInfo[];
  gameMode: GameMode;
  currentAnimation?: PieceAnimationInfo | null | undefined;
}

export interface PerformanceMonitorProps {
  onPerformanceChange: (fps: number, mode: PerformanceMode) => void;
}

export interface EnhancedCloudsProps {
  count?: number;
}

export interface DiscoBallProps {
  position: [number, number, number];
  scale?: number;
}

export interface EnhancedDiscoBallsProps {
  count?: number;
}

export interface SimpleEnvironmentProps {
  gameMode: GameMode;
}
