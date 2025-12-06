import { EMPTY, BOARD_SIZE } from "@shared/config/constants";
import { pieceUtils, boardUtils } from "../../utils/gameHelpers";
import { logger } from "../../utils/logger";
import type { Board, Move } from "@shared/types/game.types";
import { getAllPossibleCaptures } from "./captures";
import { getValidMoves } from "./validMoves";

export const hasCaptures = (board: Board, isPlayer: boolean) => {
  try {
    let maxCaptures = 0;

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = board[row][col];

        if (
          ((isPlayer && pieceUtils.isPlayerPiece(piece)) ||
            (!isPlayer && pieceUtils.isBotPiece(piece))) &&
          boardUtils.isDarkSquare(row, col)
        ) {
          const allCaptures = getAllPossibleCaptures(
            board,
            row,
            col,
            new Set()
          );
          if (allCaptures.length > 0) {
            const maxCapturesForPiece = Math.max(
              ...allCaptures.map((c) => c.capturedPieces ?? 0)
            );
            maxCaptures = Math.max(maxCaptures, maxCapturesForPiece);
          }
        }
      }
    }

    return maxCaptures > 0;
  } catch (error) {
    logger.error("Ошибка при проверке захватов:", (error as Error).message);
    return false;
  }
};

export const getPiecesWithCaptures = (board: Board, isPlayer: boolean) => {
  try {
    const piecesWithCaptures: Array<{
      row: number;
      col: number;
      captures: Move[];
    }> = [];
    let maxCaptures = 0;

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = board[row][col];

        if (
          ((isPlayer && pieceUtils.isPlayerPiece(piece)) ||
            (!isPlayer && pieceUtils.isBotPiece(piece))) &&
          boardUtils.isDarkSquare(row, col)
        ) {
          const allCaptures = getAllPossibleCaptures(
            board,
            row,
            col,
            new Set()
          );
          if (allCaptures.length > 0) {
            const maxCapturesForPiece = Math.max(
              ...allCaptures.map((c) => c.capturedPieces ?? 0)
            );
            maxCaptures = Math.max(maxCaptures, maxCapturesForPiece);
          }
        }
      }
    }

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = board[row][col];

        if (
          ((isPlayer && pieceUtils.isPlayerPiece(piece)) ||
            (!isPlayer && pieceUtils.isBotPiece(piece))) &&
          boardUtils.isDarkSquare(row, col)
        ) {
          const allCaptures = getAllPossibleCaptures(
            board,
            row,
            col,
            new Set()
          );
          const maxCapturesForPiece =
            allCaptures.length > 0
              ? Math.max(...allCaptures.map((c) => c.capturedPieces ?? 0))
              : 0;

          if (maxCapturesForPiece === maxCaptures && maxCaptures > 0) {
            const validCaptures = allCaptures.filter(
              (c) => (c.capturedPieces ?? 0) === maxCaptures
            );
            piecesWithCaptures.push({ row, col, captures: validCaptures });
          }
        }
      }
    }

    return piecesWithCaptures;
  } catch (error) {
    logger.error(
      "Ошибка при получении фигур с захватами:",
      (error as Error).message
    );
    return [];
  }
};

export const getValidMovesWithCapturePriority = (
  board: Board,
  row: number,
  col: number
) => {
  try {
    const piece = board[row][col];
    if (piece === EMPTY || !boardUtils.isDarkSquare(row, col)) {
      return { moves: [], captures: [], mustCapture: false } as const;
    }

    const isPlayer = pieceUtils.isPlayerPiece(piece);
    const playerHasCaptures = hasCaptures(board, isPlayer);

    if (playerHasCaptures) {
      const allCaptures = getAllPossibleCaptures(board, row, col, new Set());

      if (allCaptures.length > 0) {
        const allPlayerPieces = getPiecesWithCaptures(board, isPlayer);
        const globalMaxCaptures =
          allPlayerPieces.length > 0
            ? Math.max(
                ...allPlayerPieces.flatMap((p) =>
                  p.captures.map((c) => c.capturedPieces ?? 0)
                )
              )
            : 0;

        const validCaptures = allCaptures.filter(
          (c) => (c.capturedPieces ?? 0) === globalMaxCaptures
        );

        if (validCaptures.length > 0) {
          return {
            moves: validCaptures,
            captures: validCaptures,
            mustCapture: true,
          } as const;
        }
      }

      return { moves: [], captures: [], mustCapture: true } as const;
    }

    return getValidMoves(board, row, col);
  } catch (error) {
    logger.error(
      "Ошибка при получении ходов с приоритетом захвата:",
      (error as Error).message
    );
    return { moves: [], captures: [], mustCapture: false } as const;
  }
};
