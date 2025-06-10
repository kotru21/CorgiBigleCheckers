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

export const evaluateBoard = (board) => {
  let score = 0;
  let botPieces = 0;
  let playerPieces = 0;
  let botKings = 0;
  let playerKings = 0;
  let botCaptures = 0;
  let playerCaptures = 0;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      // Учитываем только темные клетки в международных шашках
      if ((row + col) % 2 === 0) continue;

      const piece = board[row][col];

      if (piece === BOT) {
        botPieces++;
        // Стимулировать продвижение к превращению в дамку
        score += 10 + row;
        // Центральное положение ценнее для контроля доски (10x10)
        const centerDistance = Math.abs(4.5 - col) + Math.abs(4.5 - row);
        score += (5 - centerDistance) / 2;

        // Подсчитываем возможности захвата для этой фигуры
        const allCaptures = getAllPossibleCaptures(board, row, col);
        botCaptures += allCaptures.length;
      } else if (piece === BOT_KING) {
        botKings++;
        score += 30; // Дамки очень ценны в международных шашках
        // Центральное положение для дамок еще важнее
        const centerDistance = Math.abs(4.5 - col) + Math.abs(4.5 - row);
        score += 6 - centerDistance;

        // Подсчитываем возможности захвата для дамки
        const allCaptures = getAllPossibleCaptures(board, row, col);
        botCaptures += allCaptures.length;
      } else if (piece === PLAYER) {
        playerPieces++;
        score -= 10 + (BOARD_SIZE - 1 - row); // То же для фигур игрока        // Подсчитываем возможности захвата игрока
        const allCaptures = getAllPossibleCaptures(board, row, col);
        playerCaptures += allCaptures.length;
      } else if (piece === PLAYER_KING) {
        playerKings++;
        score -= 30;

        // Подсчитываем возможности захвата для дамки игрока
        const allCaptures = getAllPossibleCaptures(board, row, col);
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
  score += botCaptures * 3; // Поощряем агрессивную игру бота
  score -= playerCaptures * 2; // Штрафуем за предоставление возможностей захвата игроку

  // Если у противника не осталось ходов - это победа
  if (playerPieces + playerKings === 0) {
    score = 1000; // Большое положительное значение для победы
  }

  // Если у нас не осталось ходов - это поражение
  if (botPieces + botKings === 0) {
    score = -1000; // Большое отрицательное значение для поражения
  }

  return score;
};

// Получение всех возможных ходов для бота (международные шашки)
export const getAllBotMoves = (board) => {
  const moves = [];

  // Проходим по всей доске
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      // Учитываем только темные клетки
      if ((row + col) % 2 === 0) continue;

      const piece = board[row][col];

      // Если это фигура бота
      if (piece === BOT || piece === BOT_KING) {
        const { moves: pieceMoves, mustCapture } =
          getValidMovesWithCapturePriority(board, row, col);

        // Добавляем ходы
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
};

// Алгоритм минимакс с альфа-бета отсечением
export const minimaxAlphaBeta = (board, depth, alpha, beta, isMaximizing) => {
  // Базовый случай - достигнута максимальная глубина или игра окончена
  if (depth === 0) {
    return { score: evaluateBoard(board) };
  }

  // Получаем все возможные ходы для текущего игрока
  const moves = isMaximizing ? getAllBotMoves(board) : getAllPlayerMoves(board);

  // Если нет ходов, это поражение
  if (moves.length === 0) {
    return { score: isMaximizing ? -1000 : 1000 };
  }

  let bestMove = null;
  if (isMaximizing) {
    let maxEval = -Infinity;

    for (const move of moves) {
      // Выполняем ход на временной доске
      const newBoard = executeMove(
        board,
        move.fromRow,
        move.fromCol,
        move.toRow,
        move.toCol
      );

      // Рекурсивный вызов для следующего уровня
      const evalResult = minimaxAlphaBeta(
        newBoard,
        depth - 1,
        alpha,
        beta,
        false
      );

      // Обновляем лучший результат
      if (evalResult.score > maxEval) {
        maxEval = evalResult.score;
        bestMove = move;
      }

      // Альфа-бета отсечение
      alpha = Math.max(alpha, maxEval);
      if (beta <= alpha) {
        break;
      }
    }

    return { move: bestMove, score: maxEval };
  } else {
    let minEval = Infinity;

    for (const move of moves) {
      // ход на временной доске
      const newBoard = executeMove(
        board,
        move.fromRow,
        move.fromCol,
        move.toRow,
        move.toCol
      );

      // Рекурсивный вызов для следующего уровня
      const evalResult = minimaxAlphaBeta(
        newBoard,
        depth - 1,
        alpha,
        beta,
        true
      );

      // Обновляем лучший результат
      if (evalResult.score < minEval) {
        minEval = evalResult.score;
        bestMove = move;
      }

      // Альфа-бета отсечение
      beta = Math.min(beta, minEval);
      if (beta <= alpha) {
        break;
      }
    }

    return { move: bestMove, score: minEval };
  }
};

// Получение всех возможных ходов для игрока (международные шашки)
export const getAllPlayerMoves = (board) => {
  const moves = [];

  // Проход по всей доске
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      // Учитываем только темные клетки
      if ((row + col) % 2 === 0) continue;

      const piece = board[row][col];

      // Если это фигура игрока
      if (piece === PLAYER || piece === PLAYER_KING) {
        const { moves: pieceMoves, mustCapture } =
          getValidMovesWithCapturePriority(board, row, col);

        // Добавляем ходы
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
};

export const getBestMove = (board, depth) => {
  const result = minimaxAlphaBeta(board, depth, -Infinity, Infinity, true);
  return result.move;
};
