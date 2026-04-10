import { boardUtils } from "../utils/gameHelpers";
import type { Move, Position } from "@shared/types/game.types";

/** Достаточно row/col; массив совместим с `CaptureInfo[]` из Board3D. */
export interface CaptureSquareRef {
  row: number;
  col: number;
}

export interface SquareOverlayInput {
  selectedPiece: Position | null;
  validMoves: Move[];
  piecesWithCaptures: CaptureSquareRef[];
  hoveredSquare: Position | null;
}

export interface SquareFlags {
  isDarkSquare: boolean;
  isSelected: boolean;
  isValidMove: boolean;
  hasCapturePiece: boolean;
  isHovered: boolean;
}

export function getSquareInteractionFlags(
  row: number,
  col: number,
  overlay?: SquareOverlayInput
): SquareFlags {
  const isDarkSquare = boardUtils.isDarkSquare(row, col);
  if (!overlay) {
    return {
      isDarkSquare,
      isSelected: false,
      isValidMove: false,
      hasCapturePiece: false,
      isHovered: false,
    };
  }

  const {
    selectedPiece,
    validMoves,
    piecesWithCaptures,
    hoveredSquare,
  } = overlay;

  const isSelected =
    selectedPiece?.row === row && selectedPiece?.col === col;
  const isValidMove = validMoves.some((m) => m.row === row && m.col === col);
  const hasCapturePiece = piecesWithCaptures.some(
    (p) => p.row === row && p.col === col
  );
  const isHovered =
    hoveredSquare?.row === row && hoveredSquare?.col === col;

  return {
    isDarkSquare,
    isSelected,
    isValidMove,
    hasCapturePiece,
    isHovered,
  };
}
