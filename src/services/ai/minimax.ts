import { executeMove } from "../MoveService";
import { logger } from "../../utils/logger";
import type { Board } from "@shared/types/game.types";
import type {
  SearchMove,
  MinimaxResultInternal,
  TranspositionTable,
} from "./types";
import { evaluateBoard } from "./evaluateBoard";
import { getAllBotMoves, getAllPlayerMoves } from "./getMoves";

const transpositionTable: TranspositionTable = new Map();

export const minimaxAlphaBeta = (
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): MinimaxResultInternal => {
  const boardKey = JSON.stringify(board);
  const cacheKey = `${boardKey}-${depth}-${isMaximizing}`;

  if (transpositionTable.has(cacheKey)) {
    return transpositionTable.get(cacheKey)!;
  }

  try {
    if (depth === 0) {
      const result: MinimaxResultInternal = {
        score: evaluateBoard(board),
        move: null,
      };
      transpositionTable.set(cacheKey, result);
      return result;
    }

    const moves = isMaximizing
      ? getAllBotMoves(board)
      : getAllPlayerMoves(board);

    if (moves.length === 0) {
      const result: MinimaxResultInternal = {
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

      const result: MinimaxResultInternal = { move: bestMove, score: maxEval };
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

      const result: MinimaxResultInternal = { move: bestMove, score: minEval };
      transpositionTable.set(cacheKey, result);
      return result;
    }
  } catch (error) {
    logger.error("Ошибка в алгоритме минимакс:", (error as Error).message);
    return { move: null, score: 0 };
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
    return result.move;
  } catch (error) {
    logger.error(
      "Ошибка при получении лучшего хода:",
      (error as Error).message
    );
    return null;
  }
};

export const clearTranspositionTable = () => {
  transpositionTable.clear();
};
