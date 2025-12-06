import {
  BOARD_SIZE,
  BOT,
  BOT_KING,
  PLAYER,
  PLAYER_KING,
  EMPTY,
} from "@shared/config/constants";
import {
  getValidMovesWithCapturePriority,
  executeMove,
  getAllPossibleCaptures,
} from "./MoveService";
import { boardUtils, pieceUtils } from "../utils/gameHelpers";
import { logger } from "../utils/logger";
import type { Board, MinimaxResult } from "@shared/types/game.types";

interface SearchMove {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  isCapture?: boolean;
  mustCapture?: boolean;
}

// Оценка доски без глобальной мемоизации (кеш в транспозиционной таблице)
export const evaluateBoard = (board: Board): number => {
  try {
    let score = 0;
    const { playerPieces, botPieces, playerKings, botKings } =
      boardUtils.countPieces(board);
    let botCaptures = 0;
    let playerCaptures = 0;

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!boardUtils.isDarkSquare(row, col)) continue;

        const piece = board[row][col];

        if (piece === BOT) {
          score += 10 + row;
          const centerDistance = Math.abs(4.5 - col) + Math.abs(4.5 - row);
          score += (5 - centerDistance) / 2;

          const allCaptures = getAllPossibleCaptures(
            board,
            row,
            col,
            new Set()
          );
          botCaptures += allCaptures.length;
        } else if (piece === BOT_KING) {
          score += 30;
          const centerDistance = Math.abs(4.5 - col) + Math.abs(4.5 - row);
          score += 6 - centerDistance;

          const allCaptures = getAllPossibleCaptures(
            board,
            row,
            col,
            new Set()
          );
          botCaptures += allCaptures.length;
        } else if (piece === PLAYER) {
          score -= 10 + (BOARD_SIZE - 1 - row);
          const allCaptures = getAllPossibleCaptures(
            board,
            row,
            col,
            new Set()
          );
          playerCaptures += allCaptures.length;
        } else if (piece === PLAYER_KING) {
          score -= 30;
          const allCaptures = getAllPossibleCaptures(
            board,
            row,
            col,
            new Set()
          );
          playerCaptures += allCaptures.length;
        }
      }
    }

    const pieceDifference = botPieces + botKings - (playerPieces + playerKings);
    score += pieceDifference * 5;

    score += botKings * 10;
    score -= playerKings * 10;

    score += botCaptures * 3;
    score -= playerCaptures * 2;

    if (playerPieces + playerKings === 0) {
      score = 1000;
    }
    if (botPieces + botKings === 0) {
      score = -1000;
    }

    return score;
  } catch (error) {
    logger.error("Ошибка при оценке доски:", (error as Error).message);
    return 0;
  }
};

// Получение ходов бота без глобального кэша
export const getAllBotMoves = (board: Board): SearchMove[] => {
  const moves: SearchMove[] = [];

  try {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!boardUtils.isDarkSquare(row, col)) continue;

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

const transpositionTable = new Map<string, MinimaxResult>();

export const minimaxAlphaBeta = (
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): MinimaxResult => {
  const boardKey = JSON.stringify(board);
  const cacheKey = `${boardKey}-${depth}-${isMaximizing}`;

  if (transpositionTable.has(cacheKey)) {
    return transpositionTable.get(cacheKey)!;
  }

  try {
    if (depth === 0) {
      const result: MinimaxResult = { score: evaluateBoard(board), move: null };
      transpositionTable.set(cacheKey, result);
      return result;
    }

    const moves = isMaximizing
      ? getAllBotMoves(board)
      : getAllPlayerMoves(board);

    if (moves.length === 0) {
      const result: MinimaxResult = {
        score: isMaximizing ? -1000 : 1000,
        move: null,
      };
      transpositionTable.set(cacheKey, result);
      return result;
    }

    let bestMove: SearchMove | null = null;

    if (isMaximizing) {
      let maxEval = -Infinity;

      for (const move of moves) {
        const newBoard = executeMove(
          board,
          move.fromRow,
          move.fromCol,
          move.toRow,
          move.toCol
        );

        const evalResult = minimaxAlphaBeta(
          newBoard,
          depth - 1,
          alpha,
          beta,
          false
        );

        if (evalResult.score > maxEval) {
          maxEval = evalResult.score;
          bestMove = move;
        }

        alpha = Math.max(alpha, maxEval);
        if (beta <= alpha) {
          break;
        }
      }

      const result: MinimaxResult = { move: bestMove, score: maxEval };
      transpositionTable.set(cacheKey, result);
      return result;
    } else {
      let minEval = Infinity;

      for (const move of moves) {
        const newBoard = executeMove(
          board,
          move.fromRow,
          move.fromCol,
          move.toRow,
          move.toCol
        );

        const evalResult = minimaxAlphaBeta(
          newBoard,
          depth - 1,
          alpha,
          beta,
          true
        );

        if (evalResult.score < minEval) {
          minEval = evalResult.score;
          bestMove = move;
        }

        beta = Math.min(beta, minEval);
        if (beta <= alpha) {
          break;
        }
      }

      const result: MinimaxResult = { move: bestMove, score: minEval };
      transpositionTable.set(cacheKey, result);
      return result;
    }
  } catch (error) {
    logger.error("Ошибка в алгоритме минимакс:", (error as Error).message);
    return { move: null, score: 0 };
  }
};

// Получение ходов игрока без глобального кэша
export const getAllPlayerMoves = (board: Board): SearchMove[] => {
  const moves: SearchMove[] = [];

  try {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!boardUtils.isDarkSquare(row, col)) continue;

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

export const getBestMove = (board: Board, depth: number): SearchMove | null => {
  try {
    if (transpositionTable.size > 1000) {
      transpositionTable.clear();
      logger.debug("Очищен кэш транспозиционных таблиц");
    }

    const result = minimaxAlphaBeta(board, depth, -Infinity, Infinity, true);
    logger.debug(`Найден лучший ход с оценкой: ${result.score}`);
    return result.move as SearchMove | null;
  } catch (error) {
    logger.error(
      "Ошибка при получении лучшего хода:",
      (error as Error).message
    );
    return null;
  }
};
