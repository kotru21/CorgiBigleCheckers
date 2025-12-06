import { BOARD_SIZE, BOT, PLAYER, EMPTY } from "@shared/config/constants";
import { getValidMovesWithCapturePriority, executeMove } from "./MoveService";
import { boardUtils, pieceUtils } from "../utils/gameHelpers";
import { logger } from "../utils/logger";
import type { Board, Player as PlayerType } from "@shared/types/game.types";

// Создание начальной доски
export const createInitialBoard = (): Board => {
  try {
    const board: Board = Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(EMPTY));

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (boardUtils.isDarkSquare(row, col)) {
          board[row][col] = BOT;
        }
      }
    }

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
    logger.error(
      "Ошибка при создании начальной доски:",
      (error as Error).message
    );
    throw error;
  }
};

export const movePiece = (
  board: Board,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): Board => {
  try {
    return executeMove(board, fromRow, fromCol, toRow, toCol);
  } catch (error) {
    logger.error("Ошибка при перемещении фигуры:", (error as Error).message);
    throw error;
  }
};

// Проверка статуса игры без мемоизации (чистая функция)
export const checkGameStatus = (board: Board): PlayerType | null => {
  try {
    const { playerPieces, botPieces, playerKings, botKings } =
      boardUtils.countPieces(board);

    if (botPieces + botKings === 0) {
      return PLAYER as PlayerType;
    }
    if (playerPieces + playerKings === 0) {
      return BOT as PlayerType;
    }

    let botHasMoves = false;
    let playerHasMoves = false;

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

    if (!botHasMoves) {
      return PLAYER as PlayerType;
    }
    if (!playerHasMoves) {
      return BOT as PlayerType;
    }

    return null;
  } catch (error) {
    logger.error("Ошибка при проверке статуса игры:", (error as Error).message);
    return null;
  }
};
