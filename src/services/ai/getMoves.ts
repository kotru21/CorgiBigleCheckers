import { BOARD_SIZE } from "@shared/config/constants";
import { getValidMovesWithCapturePriority } from "../MoveService";
import { boardUtils, pieceUtils } from "../../utils/gameHelpers";
import { logger } from "../../utils/logger";
import type { Board } from "@shared/types/game.types";
import type { SearchMove } from "./types";

export const getAllBotMoves = (board: Board): SearchMove[] => {
  const moves: SearchMove[] = [];

  try {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!boardUtils.isDarkSquare(row, col)) {
          continue;
        }

        const piece = board[row][col];

        if (pieceUtils.isBotPiece(piece)) {
          const { moves: pieceMoves, mustCapture } =
            getValidMovesWithCapturePriority(board, row, col);

          pieceMoves.forEach((move) => {
            moves.push({
              fromRow: row,
              fromCol: col,
              toRow: move.row,
              toCol: move.col,
              isCapture: move.capturedRow !== undefined,
              mustCapture,
            });
          });
        }
      }
    }

    return moves;
  } catch (error) {
    logger.error("Ошибка при получении ходов бота:", (error as Error).message);
    return [];
  }
};

export const getAllPlayerMoves = (board: Board): SearchMove[] => {
  const moves: SearchMove[] = [];

  try {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!boardUtils.isDarkSquare(row, col)) {
          continue;
        }

        const piece = board[row][col];

        if (pieceUtils.isPlayerPiece(piece)) {
          const { moves: pieceMoves, mustCapture } =
            getValidMovesWithCapturePriority(board, row, col);

          pieceMoves.forEach((move) => {
            moves.push({
              fromRow: row,
              fromCol: col,
              toRow: move.row,
              toCol: move.col,
              isCapture: move.capturedRow !== undefined,
              mustCapture,
            });
          });
        }
      }
    }

    return moves;
  } catch (error) {
    logger.error(
      "Ошибка при получении ходов игрока:",
      (error as Error).message
    );
    return [];
  }
};
