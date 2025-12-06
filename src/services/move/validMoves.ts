import { EMPTY } from "@shared/config/constants";
import { boardUtils } from "../../utils/gameHelpers";
import type { Board, Move } from "@shared/types/game.types";
import { getMoveDirections, getPieceInfo } from "./helpers";
import { getAllPossibleCaptures } from "./captures";

// Получить валидные ходы для конкретной фигуры
export const getValidMoves = (board: Board, row: number, col: number) => {
  const piece = board[row][col];
  const moves: Move[] = [];

  if (piece === EMPTY || !boardUtils.isDarkSquare(row, col)) {
    return { moves: [], captures: [], mustCapture: false } as const;
  }

  const { isPlayer, isKing } = getPieceInfo(piece);
  const allCaptures = getAllPossibleCaptures(board, row, col, new Set());

  if (allCaptures.length > 0) {
    const maxCaptured = Math.max(
      ...allCaptures.map((c) => c.capturedPieces ?? 0)
    );
    const captures = allCaptures.filter(
      (c) => (c.capturedPieces ?? 0) === maxCaptured
    );
    return { moves: captures, captures, mustCapture: true } as const;
  }

  const moveDirections = getMoveDirections(isPlayer, isKing);

  moveDirections.forEach(([rowDir, colDir]) => {
    if (isKing) {
      let distance = 1;
      while (true) {
        const newRow = row + rowDir * distance;
        const newCol = col + colDir * distance;

        if (!boardUtils.isValidPosition(newRow, newCol)) {
          break;
        }
        if (!boardUtils.isDarkSquare(newRow, newCol)) {
          distance++;
          continue;
        }

        if (board[newRow][newCol] === EMPTY) {
          moves.push({ row: newRow, col: newCol });
          distance++;
        } else {
          break;
        }
      }
    } else {
      const newRow = row + rowDir;
      const newCol = col + colDir;

      if (
        boardUtils.isValidSquare(newRow, newCol) &&
        board[newRow][newCol] === EMPTY
      ) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  });

  return { moves, captures: [], mustCapture: false } as const;
};
