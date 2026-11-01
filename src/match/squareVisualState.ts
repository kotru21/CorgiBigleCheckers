import type { PieceMove, Position } from "@/shared/types/game.types";
import { isDarkSquare as isDark } from "@/engine";

export interface BoardOverlay {
  selectedPiece: Position | null;
  validMoves: Position[];
  piecesWithCaptures: Position[];
  pendingCaptures: Position[];
  lastMoveSquares: Position[];
  hintSquares: Position[];
  cursor: Position | null;
}

export interface SquareOverlayInput extends BoardOverlay {
  hoveredSquare: Position | null;
}

export interface SquareFlags {
  isDarkSquare: boolean;
  isSelected: boolean;
  isValidMove: boolean;
  hasCapturePiece: boolean;
  isPendingCapture: boolean;
  isLastMove: boolean;
  isHint: boolean;
  isCursor: boolean;
  isHovered: boolean;
}

const includes = (list: Position[], row: number, col: number) =>
  list.some((p) => p.row === row && p.col === col);

const at = (p: Position | null, row: number, col: number) =>
  p?.row === row && p?.col === col;

export const moveSquares = (move: PieceMove | null): Position[] =>
  move ? [move.from, ...move.path] : [];

export const EMPTY_OVERLAY: BoardOverlay = {
  selectedPiece: null,
  validMoves: [],
  piecesWithCaptures: [],
  pendingCaptures: [],
  lastMoveSquares: [],
  hintSquares: [],
  cursor: null,
};

export function getSquareInteractionFlags(
  row: number,
  col: number,
  overlay?: SquareOverlayInput
): SquareFlags {
  const isDarkSquare = isDark(row, col);
  if (!overlay) {
    return {
      isDarkSquare,
      isSelected: false,
      isValidMove: false,
      hasCapturePiece: false,
      isPendingCapture: false,
      isLastMove: false,
      isHint: false,
      isCursor: false,
      isHovered: false,
    };
  }

  return {
    isDarkSquare,
    isSelected: at(overlay.selectedPiece, row, col),
    isValidMove: includes(overlay.validMoves, row, col),
    hasCapturePiece: includes(overlay.piecesWithCaptures, row, col),
    isPendingCapture: includes(overlay.pendingCaptures, row, col),
    isLastMove: includes(overlay.lastMoveSquares, row, col),
    isHint: includes(overlay.hintSquares, row, col),
    isCursor: at(overlay.cursor, row, col),
    isHovered: at(overlay.hoveredSquare, row, col),
  };
}
