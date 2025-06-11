import {
  BOARD_SIZE,
  BOT,
  PLAYER,
  EMPTY,
  BOT_KING,
  PLAYER_KING,
} from "../models/Constants";
import { getValidMovesWithCapturePriority, executeMove } from "./MoveService";
import {
  boardUtils,
  pieceUtils,
  performanceUtils,
} from "../utils/gameHelpers.js";
import { logger } from "../utils/logger.js";

// Мемоизированная функция создания доски
export const createInitialBoard = performanceUtils.memoize(() => {
  try {
    const board = Array(BOARD_SIZE)
      .fill()
      .map(() => Array(BOARD_SIZE).fill(EMPTY));

    // Расстановка шашек бота (темные) - на рядах 0, 1, 2, 3 ТОЛЬКО на темных клетках
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (boardUtils.isDarkSquare(row, col)) {
          board[row][col] = BOT;
        }
      }
    }

    // Расстановка шашек игрока (светлые) - на рядах 6, 7, 8, 9 ТОЛЬКО на темных клетках
    for (let row = 6; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (boardUtils.isDarkSquare(row, col)) {
          board[row][col] = PLAYER;
        }
      }
    }

    logger.info("Создана начальная доска по правилам международных шашек");
    return board;
  } catch (error) {
    logger.error("Ошибка при создании начальной доски:", error.message);
    throw error;
  }
});

export const movePiece = (board, fromRow, fromCol, toRow, toCol) => {
  try {
    return executeMove(board, fromRow, fromCol, toRow, toCol);
  } catch (error) {
    logger.error("Ошибка при перемещении фигуры:", error.message);
    throw error;
  }
};

// Мемоизированная проверка статуса игры
export const checkGameStatus = performanceUtils.memoize((board) => {
  try {
    const { playerPieces, botPieces, playerKings, botKings } =
      boardUtils.countPieces(board);

    if (botPieces + botKings === 0) return PLAYER;
    if (playerPieces + playerKings === 0) return BOT;

    // Проверяем, есть ли у игроков возможные ходы
    let botHasMoves = false;
    let playerHasMoves = false;

    // Проверяем, есть ли ходы у бота
    for (let row = 0; row < BOARD_SIZE && !botHasMoves; row++) {
      for (let col = 0; col < BOARD_SIZE && !botHasMoves; col++) {
        const piece = board[row][col];
        if (pieceUtils.isBotPiece(piece) && boardUtils.isDarkSquare(row, col)) {
          const { moves } = getValidMovesWithCapturePriority(board, row, col);
          if (moves.length > 0) {
            botHasMoves = true;
            break;
          }
        }
      }
    }

    // Проверяем, есть ли ходы у игрока
    for (let row = 0; row < BOARD_SIZE && !playerHasMoves; row++) {
      for (let col = 0; col < BOARD_SIZE && !playerHasMoves; col++) {
        const piece = board[row][col];
        if (
          pieceUtils.isPlayerPiece(piece) &&
          boardUtils.isDarkSquare(row, col)
        ) {
          const { moves } = getValidMovesWithCapturePriority(board, row, col);
          if (moves.length > 0) {
            playerHasMoves = true;
            break;
          }
        }
      }
    }

    if (!botHasMoves) return PLAYER;
    if (!playerHasMoves) return BOT;

    return null;
  } catch (error) {
    logger.error("Ошибка при проверке статуса игры:", error.message);
    return null;
  }
});
