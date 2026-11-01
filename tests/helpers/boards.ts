import type { Board, PieceType, Position } from "@/shared/types/game.types";
import { createEmptyBoard, isDarkSquare } from "@/engine";

export function boardWith(
  pieces: Array<[number, number, PieceType]>,
  size = 10
): Board {
  const board = createEmptyBoard(size);
  for (const [row, col, piece] of pieces) {
    if (!isDarkSquare(row, col)) {
      throw new Error(`Фигура на светлом поле (${row}, ${col})`);
    }
    board[row][col] = piece;
  }
  return board;
}

export const pos = (row: number, col: number): Position => ({ row, col });
