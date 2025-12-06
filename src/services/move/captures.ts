import { EMPTY } from "@shared/config/constants";
import { logger } from "../../utils/logger";
import type { Board, Move } from "@shared/types/game.types";
import {
  findKingCaptures,
  findRegularCaptures,
  getMoveDirections,
  getPieceInfo,
} from "./helpers";

// Поиск всех возможных захватов для фигуры (правило большинства)
export const getAllPossibleCaptures = (
  board: Board,
  row: number,
  col: number,
  visited: Set<string> | string[] = new Set()
): Move[] => {
  const visitedSet =
    visited instanceof Set ? new Set(visited) : new Set(visited);
  const piece = board[row][col];

  if (piece === EMPTY || visitedSet.has(`${row}-${col}`)) {
    return [];
  }

  try {
    visitedSet.add(`${row}-${col}`);
    const { isPlayer, isKing } = getPieceInfo(piece);
    const directions = getMoveDirections(isPlayer, isKing);
    const captures: Move[] = [];

    for (const [rowDir, colDir] of directions) {
      const resolver = (
        nextBoard: Board,
        nextRow: number,
        nextCol: number,
        nextVisited: Set<string>
      ) => getAllPossibleCaptures(nextBoard, nextRow, nextCol, nextVisited);

      if (isKing) {
        captures.push(
          ...findKingCaptures(
            board,
            row,
            col,
            rowDir,
            colDir,
            piece,
            isPlayer,
            visitedSet,
            resolver
          )
        );
      } else {
        captures.push(
          ...findRegularCaptures(
            board,
            row,
            col,
            rowDir,
            colDir,
            piece,
            isPlayer,
            visitedSet,
            resolver
          )
        );
      }
    }

    return captures;
  } catch (error) {
    logger.error("Ошибка при поиске захватов:", (error as Error).message);
    return [];
  }
};
