import type { ReactNode } from "react";
import type { Board, GameMode, Player } from "@/shared/types/game.types";
import type { BoardOverlay } from "@/match/squareVisualState";
import type { PerformanceMode } from "./performanceStore";

export type { PerformanceMode, BoardOverlay };

export interface BoardViewProps {
  board: Board;
  gameMode: GameMode;
  overlay: BoardOverlay;
  controllableSide: Player | null;
  onSquareSelect: (row: number, col: number) => void;
}

export interface BoardFrameProps {
  size: number;
  gameMode: GameMode;
  children?: ReactNode;
}

export interface BoardSquaresProps {
  size: number;
  overlay: BoardOverlay;
  gameMode: GameMode;
  onSquareSelect: (row: number, col: number) => void;
}

export interface SkyWithCloudsAndSunProps {
  performanceMode: PerformanceMode;
  gameMode: GameMode;
}

export interface SunProps {
  performanceMode: PerformanceMode;
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
