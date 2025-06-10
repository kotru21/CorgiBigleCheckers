import {
  BOARD_SIZE,
  BOT,
  BOT_KING,
  PLAYER,
  PLAYER_KING,
  EMPTY,
} from "../models/Constants";

// Правила турецких шашек
export const turkishDraughtsRules = {
  boardSize: 8,

  gameFeatures: [
    "Игра ведется на всех клетках доски 8×8 (как белых, так и черных)",
    "Шашки ходят по горизонтали и вертикали (не по диагонали)",
    "В начальной позиции у каждого игрока по 16 шашек, расположенных на 1-2 и 5-6 рядах",
    "Первый и последний ряды, а также два центральных ряда (3-4) остаются пустыми",
    "Дамка может ходить на любое количество клеток по горизонтали, вертикали и диагонали",
    "Взятие обязательно, при наличии нескольких вариантов можно выбрать любой",
    "Взятие происходит перепрыгиванием через фигуру противника",
    "Дамка может перепрыгивать на любое расстояние до и после взятия",
    "Взятие происходит по тем же линиям, по которым фигуры ходят (шашки - по горизонтали и вертикали, дамки - также и по диагонали)",
  ],

  // Проверка окончания игры
  isGameOver: (board) => {
    let botPieces = 0;
    let playerPieces = 0;

    // Подсчет количества фигур обоих игроков
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = board[row][col];
        if (piece === BOT || piece === BOT_KING) botPieces++;
        if (piece === PLAYER || piece === PLAYER_KING) playerPieces++;
      }
    }

    // Игра окончена, если у одного из игроков не осталось фигур
    if (botPieces === 0 || playerPieces === 0) {
      return true;
    }

    // Проверка на наличие возможных ходов для игроков
    const botHasMoves = checkPlayerHasMoves(board, false);
    const playerHasMoves = checkPlayerHasMoves(board, true);

    // Игра окончена, если у одного из игроков нет ходов
    return !botHasMoves || !playerHasMoves;
  },

  // Определение победителя
  getWinner: (board) => {
    let botPieces = 0;
    let playerPieces = 0;

    // Подсчет количества фигур обоих игроков
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = board[row][col];
        if (piece === BOT || piece === BOT_KING) botPieces++;
        if (piece === PLAYER || piece === PLAYER_KING) playerPieces++;
      }
    }

    if (botPieces === 0) return "PLAYER";
    if (playerPieces === 0) return "BOT";

    // Проверка на наличие возможных ходов
    const botHasMoves = checkPlayerHasMoves(board, false);
    const playerHasMoves = checkPlayerHasMoves(board, true);

    if (!playerHasMoves) return "BOT";
    if (!botHasMoves) return "PLAYER";

    return null; // Игра продолжается
  },
};

// Вспомогательная функция для проверки наличия ходов у игрока
const checkPlayerHasMoves = (board, isPlayer) => {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];

      // Проверяем только фигуры нужного игрока
      if (
        (isPlayer && (piece === PLAYER || piece === PLAYER_KING)) ||
        (!isPlayer && (piece === BOT || piece === BOT_KING))
      ) {
        // Получаем все возможные ходы для этой фигуры
        const { moves } = getValidMovesWithCapturePriority(board, row, col);

        // Если есть хоть один возможный ход, игрок может ходить
        if (moves.length > 0) {
          return true;
        }
      }
    }
  }

  // Не найдено возможных ходов
  return false;
};

// Импортируем функцию из MoveService, чтобы избежать циклической зависимости
import { getValidMovesWithCapturePriority } from "./MoveService";

export default turkishDraughtsRules;
