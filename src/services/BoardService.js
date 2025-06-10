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

  // В турецких шашках начальная позиция:
  // - Первый ряд (0) пустой
  // - Шашки бота (корги) на рядах 1 и 2
  // - Шашки игрока (бигли) на рядах 5 и 6
  // - Последний ряд (7) пустой

  // Расстановка шашек бота (корги) - 16 шашек в два ряда (ряды 1 и 2)
  for (let row = 1; row < 3; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      board[row][col] = BOT;
    }
  }

  // Расстановка шашек игрока (бигли) - 16 шашек в два ряда (ряды 5 и 6)
  for (let row = 5; row < 7; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      board[row][col] = PLAYER;
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
