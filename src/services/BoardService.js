import {
  BOARD_SIZE,
  BOT,
  PLAYER,
  EMPTY,
  BOT_KING,
  PLAYER_KING,
} from "../models/Constants";
import { getValidMovesWithCapturePriority, executeMove } from "./MoveService";

export const createInitialBoard = () => {
  const board = Array(BOARD_SIZE)
    .fill()
    .map(() => Array(BOARD_SIZE).fill(EMPTY));

  // В международных шашках расстановка происходит только на темных клетках
  // Темные клетки - это клетки где (row + col) % 2 === 1
  // Шашки игрока (белые) располагаются на рядах 6, 7, 8, 9
  // Шашки бота (черные) располагаются на рядах 0, 1, 2, 3

  // Расстановка шашек бота (черные) - на рядах 0, 1, 2, 3 на темных клетках
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      // Ставим шашки только на темные клетки
      if ((row + col) % 2 === 1) {
        board[row][col] = BOT;
      }
    }
  }

  // Расстановка шашек игрока (белые) - на рядах 6, 7, 8, 9 на темных клетках
  for (let row = 6; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      // Ставим шашки только на темные клетки
      if ((row + col) % 2 === 1) {
        board[row][col] = PLAYER;
      }
    }
  }

  return board;
};

export const movePiece = (board, fromRow, fromCol, toRow, toCol) => {
  // Используем executeMove из MoveService для единообразной логики
  return executeMove(board, fromRow, fromCol, toRow, toCol);
};

export const checkGameStatus = (board) => {
  let botPieces = 0;
  let playerPieces = 0;

  // Подсчёт фигур
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece === PLAYER || piece === PLAYER_KING) playerPieces++;
      if (piece === BOT || piece === BOT_KING) botPieces++;
    }
  }

  if (botPieces === 0) return PLAYER;
  if (playerPieces === 0) return BOT;
  // Проверяем, есть ли у игроков возможные ходы
  let botHasMoves = false;
  let playerHasMoves = false;
  // Проверяем, есть ли ходы у бота
  for (let row = 0; row < BOARD_SIZE && !botHasMoves; row++) {
    for (let col = 0; col < BOARD_SIZE && !botHasMoves; col++) {
      const piece = board[row][col];
      if (piece === BOT || piece === BOT_KING) {
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
      if (piece === PLAYER || piece === PLAYER_KING) {
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
};
