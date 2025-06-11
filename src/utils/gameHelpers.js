import {
  BOT,
  BOT_KING,
  PLAYER,
  PLAYER_KING,
  EMPTY,
  BOARD_SIZE,
} from "../models/Constants.js";

// Утилиты для работы с фигурами
export const pieceUtils = {
  isPlayerPiece: (piece) => piece === PLAYER || piece === PLAYER_KING,
  isBotPiece: (piece) => piece === BOT || piece === BOT_KING,
  isKing: (piece) => piece === PLAYER_KING || piece === BOT_KING,
  isEmpty: (piece) => piece === EMPTY,

  getPieceOwner: (piece) => {
    if (pieceUtils.isPlayerPiece(piece)) return "player";
    if (pieceUtils.isBotPiece(piece)) return "bot";
    return null;
  },
};

// Утилиты для работы с доской
export const boardUtils = {
  isValidPosition: (row, col) => {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
  },

  isDarkSquare: (row, col) => {
    return (row + col) % 2 === 1;
  },

  isValidSquare: (row, col) => {
    return (
      boardUtils.isValidPosition(row, col) && boardUtils.isDarkSquare(row, col)
    );
  },

  copyBoard: (board) => {
    return board.map((row) => [...row]);
  },

  countPieces: (board) => {
    let playerPieces = 0;
    let botPieces = 0;
    let playerKings = 0;
    let botKings = 0;

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = board[row][col];
        if (piece === PLAYER) playerPieces++;
        else if (piece === BOT) botPieces++;
        else if (piece === PLAYER_KING) playerKings++;
        else if (piece === BOT_KING) botKings++;
      }
    }

    return { playerPieces, botPieces, playerKings, botKings };
  },
};

// Утилиты для валидации
export const validationUtils = {
  validateMove: (board, fromRow, fromCol, toRow, toCol) => {
    if (
      !boardUtils.isValidSquare(fromRow, fromCol) ||
      !boardUtils.isValidSquare(toRow, toCol)
    ) {
      throw new Error("Недопустимые координаты хода");
    }

    if (pieceUtils.isEmpty(board[fromRow][fromCol])) {
      throw new Error("Нет фигуры для перемещения");
    }

    if (!pieceUtils.isEmpty(board[toRow][toCol])) {
      throw new Error("Целевая клетка занята");
    }

    return true;
  },

  validateBoard: (board) => {
    if (!Array.isArray(board) || board.length !== BOARD_SIZE) {
      throw new Error("Неверный размер доски");
    }

    for (const row of board) {
      if (!Array.isArray(row) || row.length !== BOARD_SIZE) {
        throw new Error("Неверный размер строки доски");
      }
    }

    return true;
  },

  validateInternationalDraughtsRules: (board) => {
    try {
      validationUtils.validateBoard(board);

      let playerCount = 0;
      let botCount = 0;

      // Проверяем, что фигуры стоят только на темных клетках
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const piece = board[row][col];

          if (piece !== EMPTY) {
            // Все фигуры должны быть только на темных клетках
            if (!boardUtils.isDarkSquare(row, col)) {
              throw new Error(
                `Фигура на светлой клетке (${row}, ${col}) - нарушение правил международных шашек`
              );
            }

            if (pieceUtils.isPlayerPiece(piece)) {
              playerCount++;
            } else if (pieceUtils.isBotPiece(piece)) {
              botCount++;
            }
          }
        }
      }

      // В начале игры должно быть по 20 фигур
      if (playerCount > 20 || botCount > 20) {
        throw new Error(
          "Превышено максимальное количество фигур для международных шашек"
        );
      }

      return true;
    } catch (error) {
      logger.error(
        "Ошибка валидации правил международных шашек:",
        error.message
      );
      throw error;
    }
  },
};

// Утилиты для производительности
export const performanceUtils = {
  memoize: (fn, keyGenerator = (...args) => JSON.stringify(args)) => {
    const cache = new Map();

    return (...args) => {
      const key = keyGenerator(...args);

      if (cache.has(key)) {
        return cache.get(key);
      }

      const result = fn(...args);
      cache.set(key, result);

      // Ограничиваем размер кэша
      if (cache.size > 1000) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }

      return result;
    };
  },

  debounce: (func, wait) => {
    let timeout;

    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Новая функция throttle для ограничения частоты вызовов
  throttle: (func, limit) => {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
};
