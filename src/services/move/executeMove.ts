import {
  BOARD_SIZE,
  BOT,
  BOT_KING,
  PLAYER,
  PLAYER_KING,
  EMPTY,
} from "@shared/config/constants";
import { boardUtils, validationUtils } from "../../utils/gameHelpers";
import { logger } from "../../utils/logger";
import type { Board } from "@shared/types/game.types";

// Выполнение хода с обработкой захватов и превращения в дамку
export const executeMove = (
  board: Board,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): Board => {
  validationUtils.validateMove(board, fromRow, fromCol, toRow, toCol);

  const newBoard = boardUtils.copyBoard(board);
  const piece = newBoard[fromRow][fromCol];

  newBoard[toRow][toCol] = piece;
  newBoard[fromRow][fromCol] = EMPTY;

  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);

  // Обработка захвата: если ход больше 1 клетки по диагонали
  if (rowDiff === colDiff && rowDiff >= 2) {
    const rowDir = Math.sign(toRow - fromRow);
    const colDir = Math.sign(toCol - fromCol);

    let checkRow = fromRow + rowDir;
    let checkCol = fromCol + colDir;
    while (checkRow !== toRow || checkCol !== toCol) {
      if (newBoard[checkRow][checkCol] !== EMPTY) {
        newBoard[checkRow][checkCol] = EMPTY;
        break;
      }
      checkRow += rowDir;
      checkCol += colDir;
    }
  }

  if (piece === PLAYER && toRow === 0) {
    newBoard[toRow][toCol] = PLAYER_KING;
  } else if (piece === BOT && toRow === BOARD_SIZE - 1) {
    newBoard[toRow][toCol] = BOT_KING;
  }

  logger.debug(`Ход выполнен: (${fromRow},${fromCol}) -> (${toRow},${toCol})`);
  return newBoard;
};
