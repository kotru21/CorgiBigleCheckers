import { EMPTY } from "@/shared/config/constants";
import type { Board, PieceMove, Position } from "@/shared/types/game.types";
import { copyBoard, kingOf, ownerOf } from "./board";
import { finalSquare } from "./moveGeneration";

export const applyMove = (board: Board, move: PieceMove): Board => {
  const { from } = move;
  const piece = board[from.row][from.col];
  const side = ownerOf(piece);
  if (side === null) {
    throw new Error(`Нет фигуры на поле (${from.row}, ${from.col})`);
  }

  const next = copyBoard(board);
  next[from.row][from.col] = EMPTY;
  for (const { row, col } of move.captures) {
    next[row][col] = EMPTY;
  }
  const to = finalSquare(move);
  next[to.row][to.col] = move.promotes ? kingOf(side) : piece;
  return next;
};

export const relocatePiece = (
  board: Board,
  from: Position,
  to: Position
): Board => {
  const next = copyBoard(board);
  next[to.row][to.col] = next[from.row][from.col];
  if (from.row !== to.row || from.col !== to.col) {
    next[from.row][from.col] = EMPTY;
  }
  return next;
};
