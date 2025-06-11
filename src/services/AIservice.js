import {
  BOARD_SIZE,
  BOT,
  BOT_KING,
  PLAYER,
  PLAYER_KING,
  EMPTY,
} from "../models/Constants";
import {
  getValidMovesWithCapturePriority,
  executeMove,
  getAllPossibleCaptures,
} from "./MoveService";
import {
  boardUtils,
  pieceUtils,
  performanceUtils,
} from "../utils/gameHelpers.js";
import { logger } from "../utils/logger.js";

// Мемоизированная функция оценки доски
export const evaluateBoard = performanceUtils.memoize((board) => {
  try {
    let score = 0; // Используем let вместо const
    const { playerPieces, botPieces, playerKings, botKings } =
      boardUtils.countPieces(board);
    let botCaptures = 0;
    let playerCaptures = 0;

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!boardUtils.isDarkSquare(row, col)) continue;

        const piece = board[row][col];

        if (piece === BOT) {
          // Стимулировать продвижение к превращению в дамку
          score += 10 + row;
          // Центральное положение ценнее для контроля доски
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

    // Преимущество при большем количестве фигур
    const pieceDifference = botPieces + botKings - (playerPieces + playerKings);
    score += pieceDifference * 5;

    // Бонус за наличие дамок
    score += botKings * 10;
    score -= playerKings * 10;

    // Бонус за возможности захвата
    score += botCaptures * 3;
    score -= playerCaptures * 2;

    // Победа/поражение
    if (playerPieces + playerKings === 0) {
      score = 1000;
    }
    if (botPieces + botKings === 0) {
      score = -1000;
    }

    return score;
  } catch (error) {
    logger.error("Ошибка при оценке доски:", error.message);
    return 0;
  }
});

// Мемоизированная функция получения ходов бота
export const getAllBotMoves = performanceUtils.memoize((board) => {
  const moves = [];

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
    logger.error("Ошибка при получении ходов бота:", error.message);
    return [];
  }
});

// Улучшенный алгоритм минимакс с транспозиционными таблицами
const transpositionTable = new Map();

export const minimaxAlphaBeta = (board, depth, alpha, beta, isMaximizing) => {
  const boardKey = JSON.stringify(board);
  const cacheKey = `${boardKey}-${depth}-${isMaximizing}`;

  if (transpositionTable.has(cacheKey)) {
    return transpositionTable.get(cacheKey);
  }

  try {
    if (depth === 0) {
      const result = { score: evaluateBoard(board) };
      transpositionTable.set(cacheKey, result);
      return result;
    }

    const moves = isMaximizing
      ? getAllBotMoves(board)
      : getAllPlayerMoves(board);

    if (moves.length === 0) {
      const result = { score: isMaximizing ? -1000 : 1000 };
      transpositionTable.set(cacheKey, result);
      return result;
    }

    let bestMove = null;

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

      const result = { move: bestMove, score: maxEval };
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

      const result = { move: bestMove, score: minEval };
      transpositionTable.set(cacheKey, result);
      return result;
    }
  } catch (error) {
    logger.error("Ошибка в алгоритме минимакс:", error.message);
    return { move: null, score: 0 };
  }
};

// Мемоизированная функция получения ходов игрока
export const getAllPlayerMoves = performanceUtils.memoize((board) => {
  const moves = [];

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
    logger.error("Ошибка при получении ходов игрока:", error.message);
    return [];
  }
});

export const getBestMove = (board, depth) => {
  try {
    // Очищаем кэш каждые 100 вызовов для предотвращения переполнения памяти
    if (transpositionTable.size > 1000) {
      transpositionTable.clear();
      logger.debug("Очищен кэш транспозиционных таблиц");
    }

    const result = minimaxAlphaBeta(board, depth, -Infinity, Infinity, true);
    logger.debug(`Найден лучший ход с оценкой: ${result.score}`);
    return result.move;
  } catch (error) {
    logger.error("Ошибка при получении лучшего хода:", error.message);
    return null;
  }
};
