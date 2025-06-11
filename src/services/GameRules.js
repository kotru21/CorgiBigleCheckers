import {
  BOARD_SIZE,
  BOT,
  BOT_KING,
  PLAYER,
  PLAYER_KING,
  EMPTY,
} from "../models/Constants";

// Вспомогательная функция для проверки наличия ходов у игрока
const checkPlayerHasMoves = (board, isPlayer) => {
  // Импортируем функцию динамически для избежания циклической зависимости
  return import("./MoveService").then(
    ({ getValidMovesWithCapturePriority }) => {
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const piece = board[row][col];

          if (
            (isPlayer && (piece === PLAYER || piece === PLAYER_KING)) ||
            (!isPlayer && (piece === BOT || piece === BOT_KING))
          ) {
            const { moves } = getValidMovesWithCapturePriority(board, row, col);
            if (moves.length > 0) {
              return true;
            }
          }
        }
      }
      return false;
    }
  );
};

// Синхронная версия для проверки наличия фигур
const checkPlayerHasPieces = (board, isPlayer) => {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (
        (isPlayer && (piece === PLAYER || piece === PLAYER_KING)) ||
        (!isPlayer && (piece === BOT || piece === BOT_KING))
      ) {
        return true;
      }
    }
  }
  return false;
};

// Правила международных (стоклеточных) шашек
export const internationalDraughtsRules = {
  boardSize: 10,

  gameFeatures: [
    "Игра ведется на доске 10×10 клеток, только на темных (черных) клетках",
    "Шашки ходят только по диагоналям",
    "В начальной позиции у каждого игрока по 20 шашек, расположенных на первых 4 рядах темных клеток",
    "Простые шашки могут ходить только вперед по диагонали",
    "Дамка может ходить на любое количество клеток по диагонали в любом направлении",
    "Взятие обязательно, при наличии нескольких вариантов нужно выбрать наибольшее количество",
    "Взятие происходит перепрыгиванием через фигуру противника по диагонали",
    "Дамка может перепрыгивать на любое расстояние до и после взятия",
    "Простая шашка, достигшая последнего ряда, становится дамкой",
    "Правило большинства: обязательно брать наибольшее количество шашек противника",
  ],

  // Проверка окончания игры
  isGameOver: async (board) => {
    // Быстрая проверка на наличие фигур
    const botHasPieces = checkPlayerHasPieces(board, false);
    const playerHasPieces = checkPlayerHasPieces(board, true);

    if (!botHasPieces || !playerHasPieces) {
      return true;
    }

    // Проверка на наличие возможных ходов (асинхронно)
    const [botHasMoves, playerHasMoves] = await Promise.all([
      checkPlayerHasMoves(board, false),
      checkPlayerHasMoves(board, true),
    ]);

    return !botHasMoves || !playerHasMoves;
  },

  // Определение победителя
  getWinner: async (board) => {
    const botHasPieces = checkPlayerHasPieces(board, false);
    const playerHasPieces = checkPlayerHasPieces(board, true);

    if (!botHasPieces) return "PLAYER";
    if (!playerHasPieces) return "BOT";

    const [botHasMoves, playerHasMoves] = await Promise.all([
      checkPlayerHasMoves(board, false),
      checkPlayerHasMoves(board, true),
    ]);

    if (!playerHasMoves) return "BOT";
    if (!botHasMoves) return "PLAYER";

    return null; // Игра продолжается
  },
};

export default internationalDraughtsRules;
