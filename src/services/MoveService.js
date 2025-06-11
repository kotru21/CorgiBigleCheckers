import {
  BOARD_SIZE,
  BOT,
  BOT_KING,
  PLAYER,
  PLAYER_KING,
  EMPTY,
  DIRECTIONS,
} from "../models/Constants";
import {
  pieceUtils,
  boardUtils,
  validationUtils,
  performanceUtils,
} from "../utils/gameHelpers.js";
import { logger } from "../utils/logger.js";

// Мемоизированные вспомогательные функции
const isEnemyPiece = performanceUtils.memoize((piece, isPlayer) => {
  if (isPlayer) {
    return piece === BOT || piece === BOT_KING;
  } else {
    return piece === PLAYER || piece === PLAYER_KING;
  }
});

const getPieceInfo = performanceUtils.memoize((piece) => {
  const isPlayer = piece === PLAYER || piece === PLAYER_KING;
  const isKing = piece === PLAYER_KING || piece === BOT_KING;
  return { isPlayer, isKing };
});

const getMoveDirections = performanceUtils.memoize((isPlayer, isKing) => {
  if (isKing) return DIRECTIONS.KING;
  return isPlayer ? DIRECTIONS.PLAYER : DIRECTIONS.BOT;
});

// Улучшенная функция создания временной доски с валидацией
const createTempBoard = (
  board,
  fromRow,
  fromCol,
  toRow,
  toCol,
  capturedRow,
  capturedCol
) => {
  try {
    validationUtils.validateBoard(board);
    validationUtils.validateMove(board, fromRow, fromCol, toRow, toCol);

    const tempBoard = boardUtils.copyBoard(board);
    const piece = tempBoard[fromRow][fromCol];

    tempBoard[toRow][toCol] = piece;
    tempBoard[fromRow][fromCol] = EMPTY;

    if (capturedRow !== undefined && capturedCol !== undefined) {
      tempBoard[capturedRow][capturedCol] = EMPTY;
    }

    return tempBoard;
  } catch (error) {
    logger.error("Ошибка при создании временной доски:", error.message);
    throw error;
  }
};

// Оптимизированная функция для поиска захватов с кэшированием
export const getAllPossibleCaptures = performanceUtils.memoize(
  (board, row, col, visited = new Set()) => {
    // Исправляем инициализацию visited - всегда создаем новый Set
    let visitedSet;
    if (visited instanceof Set) {
      visitedSet = new Set(visited); // Создаем копию
    } else if (Array.isArray(visited)) {
      visitedSet = new Set(visited);
    } else {
      visitedSet = new Set();
    }

    const piece = board[row][col];
    if (piece === EMPTY || visitedSet.has(`${row}-${col}`)) return [];

    try {
      visitedSet.add(`${row}-${col}`);
      const { isPlayer, isKing } = getPieceInfo(piece);
      const moveDirections = getMoveDirections(isPlayer, isKing);
      const allCaptures = [];

      for (const [rowDir, colDir] of moveDirections) {
        if (isKing) {
          const kingCaptures = findKingCaptures(
            board,
            row,
            col,
            rowDir,
            colDir,
            piece,
            isPlayer,
            visitedSet
          );
          allCaptures.push(...kingCaptures);
        } else {
          const regularCaptures = findRegularCaptures(
            board,
            row,
            col,
            rowDir,
            colDir,
            piece,
            isPlayer,
            visitedSet
          );
          allCaptures.push(...regularCaptures);
        }
      }

      return allCaptures;
    } catch (error) {
      logger.error("Ошибка при поиске захватов:", error.message);
      return [];
    }
  },
  // Кастомный генератор ключей для мемоизации
  (board, row, col, visited) => {
    const visitedArray = visited instanceof Set ? [...visited].sort() : 
                        Array.isArray(visited) ? [...visited].sort() : [];
    return `${JSON.stringify(board)}-${row}-${col}-${visitedArray.join(",")}`;
  }
);

// Отдельная функция для поиска захватов дамок
const findKingCaptures = (
  board,
  row,
  col,
  rowDir,
  colDir,
  piece,
  isPlayer,
  visited
) => {
  const captures = [];
  let distance = 1;
  let foundEnemy = false;
  let enemyRow = -1;
  let enemyCol = -1;

  while (true) {
    const newRow = row + rowDir * distance;
    const newCol = col + colDir * distance;

    if (
      !boardUtils.isValidPosition(newRow, newCol) ||
      !boardUtils.isDarkSquare(newRow, newCol)
    ) {
      if (!boardUtils.isDarkSquare(newRow, newCol)) {
        distance++;
        continue;
      }
      break;
    }

    const cellPiece = board[newRow][newCol];

    if (cellPiece === EMPTY) {
      if (foundEnemy) {
        const tempBoard = createTempBoard(
          board,
          row,
          col,
          newRow,
          newCol,
          enemyRow,
          enemyCol
        );
        const continuedCaptures = getAllPossibleCaptures(
          tempBoard,
          newRow,
          newCol,
          new Set(visited)
        );

        captures.push(
          createCaptureMove(
            newRow,
            newCol,
            enemyRow,
            enemyCol,
            continuedCaptures
          )
        );
      }
      distance++;
    } else if (!foundEnemy && isEnemyPiece(cellPiece, isPlayer)) {
      foundEnemy = true;
      enemyRow = newRow;
      enemyCol = newCol;
      distance++;
    } else {
      break;
    }
  }

  return captures;
};

// Отдельная функция для поиска захватов простых шашек
const findRegularCaptures = (
  board,
  row,
  col,
  rowDir,
  colDir,
  piece,
  isPlayer,
  visited
) => {
  const captures = [];
  const newRow = row + rowDir;
  const newCol = col + colDir;

  if (!boardUtils.isValidSquare(newRow, newCol)) {
    return captures;
  }

  const cellPiece = board[newRow][newCol];

  if (isEnemyPiece(cellPiece, isPlayer)) {
    const jumpRow = newRow + rowDir;
    const jumpCol = newCol + colDir;

    if (
      boardUtils.isValidSquare(jumpRow, jumpCol) &&
      board[jumpRow][jumpCol] === EMPTY
    ) {
      const tempBoard = createTempBoard(
        board,
        row,
        col,
        jumpRow,
        jumpCol,
        newRow,
        newCol
      );
      const continuedCaptures = getAllPossibleCaptures(
        tempBoard,
        jumpRow,
        jumpCol,
        new Set(visited)
      );

      captures.push(
        createCaptureMove(jumpRow, jumpCol, newRow, newCol, continuedCaptures)
      );
    }
  }

  return captures;
};

// Фабричная функция для создания объекта хода с захватом
const createCaptureMove = (
  toRow,
  toCol,
  capturedRow,
  capturedCol,
  continuedCaptures
) => {
  const maxContinuedCaptures =
    continuedCaptures.length > 0
      ? Math.max(...continuedCaptures.map((c) => c.capturedPieces))
      : 0;

  const bestContinuation = continuedCaptures.find(
    (c) => c.capturedPieces === maxContinuedCaptures
  );

  return {
    row: toRow,
    col: toCol,
    capturedRow,
    capturedCol,
    capturedPieces: 1 + maxContinuedCaptures,
    path: [{ row: toRow, col: toCol, capturedRow, capturedCol }].concat(
      bestContinuation?.path || []
    ),
  };
};

// Улучшенная функция executeMove с обработкой ошибок
export const executeMove = (board, fromRow, fromCol, toRow, toCol) => {
  try {
    validationUtils.validateMove(board, fromRow, fromCol, toRow, toCol);

    const newBoard = boardUtils.copyBoard(board);
    const piece = newBoard[fromRow][fromCol];

    // Перемещение фигуры
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = EMPTY;

    // Проверяем, был ли это захват
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    const isKing = pieceUtils.isKing(piece);

    // Для обычных шашек захват происходит через одну клетку
    if (!isKing && (rowDiff === 2 || colDiff === 2)) {
      const capturedRow = fromRow + Math.sign(toRow - fromRow);
      const capturedCol = fromCol + Math.sign(toCol - fromCol);
      newBoard[capturedRow][capturedCol] = EMPTY;
    }
    // Для дамок нужно найти захваченную фигуру между начальной и конечной позициями
    else if (isKing && (rowDiff > 1 || colDiff > 1)) {
      const rowDir = Math.sign(toRow - fromRow);
      const colDir = Math.sign(toCol - fromCol);

      // Ищем захваченную фигуру между начальной и конечной позициями
      let checkRow = fromRow + rowDir;
      let checkCol = fromCol + colDir;

      while (checkRow !== toRow || checkCol !== toCol) {
        if (newBoard[checkRow][checkCol] !== EMPTY) {
          newBoard[checkRow][checkCol] = EMPTY;
          break; // Захватываем только одну фигуру за ход
        }
        checkRow += rowDir;
        checkCol += colDir;
      }
    }

    // Проверка на превращение в дамку
    if (piece === PLAYER && toRow === 0) {
      newBoard[toRow][toCol] = PLAYER_KING;
    } else if (piece === BOT && toRow === BOARD_SIZE - 1) {
      newBoard[toRow][toCol] = BOT_KING;
    }

    logger.debug(
      `Ход выполнен: (${fromRow},${fromCol}) -> (${toRow},${toCol})`
    );
    return newBoard;
  } catch (error) {
    logger.error("Ошибка при выполнении хода:", error.message);
    throw error;
  }
};

// Модифицированная функция getValidMoves с правилом большинства
export const getValidMoves = (board, row, col) => {
  try {
    const piece = board[row][col];
    const moves = [];
    let captures = [];

    if (piece === EMPTY || !boardUtils.isDarkSquare(row, col))
      return { moves: [], captures: [] };

    const isPlayer = pieceUtils.isPlayerPiece(piece);
    const isKing = pieceUtils.isKing(piece);

    // Передаем новый Set() при вызове
    const allCaptures = getAllPossibleCaptures(board, row, col, new Set());

    if (allCaptures.length > 0) {
      const maxCaptured = Math.max(...allCaptures.map((c) => c.capturedPieces));
      captures = allCaptures.filter((c) => c.capturedPieces === maxCaptured);
      return { moves: captures, captures, mustCapture: true };
    }

    const moveDirections = getMoveDirections(isPlayer, isKing);

    moveDirections.forEach(([rowDir, colDir]) => {
      if (isKing) {
        let distance = 1;
        while (true) {
          const newRow = row + rowDir * distance;
          const newCol = col + colDir * distance;

          if (!boardUtils.isValidPosition(newRow, newCol)) {
            break;
          }

          if (!boardUtils.isDarkSquare(newRow, newCol)) {
            distance++;
            continue;
          }

          if (board[newRow][newCol] === EMPTY) {
            moves.push({ row: newRow, col: newCol });
            distance++;
          } else {
            break;
          }
        }
      } else {
        const newRow = row + rowDir;
        const newCol = col + colDir;

        if (
          boardUtils.isValidSquare(newRow, newCol) &&
          board[newRow][newCol] === EMPTY
        ) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    });

    return { moves, captures: [], mustCapture: false };
  } catch (error) {
    logger.error("Ошибка при получении валидных ходов:", error.message);
    return { moves: [], captures: [], mustCapture: false };
  }
};

// Проверяем, есть ли обязательные захваты для указанного игрока (с правилом большинства)
export const hasCaptures = (board, isPlayer) => {
  try {
    let maxCaptures = 0;

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = board[row][col];

        // Проверяем только фигуры нужного игрока на темных клетках
        if (
          ((isPlayer && pieceUtils.isPlayerPiece(piece)) ||
            (!isPlayer && pieceUtils.isBotPiece(piece))) &&
          boardUtils.isDarkSquare(row, col)
        ) {
          // Передаем новый пустой Set() при каждом вызове
          const allCaptures = getAllPossibleCaptures(
            board,
            row,
            col,
            new Set()
          );
          if (allCaptures.length > 0) {
            const maxCapturesForPiece = Math.max(
              ...allCaptures.map((c) => c.capturedPieces)
            );
            maxCaptures = Math.max(maxCaptures, maxCapturesForPiece);
          }
        }
      }
    }

    return maxCaptures > 0;
  } catch (error) {
    logger.error("Ошибка при проверке захватов:", error.message);
    return false;
  }
};

// Получаем только те фигуры, которые могут делать захваты с максимальным количеством (правило большинства)
export const getPiecesWithCaptures = (board, isPlayer) => {
  try {
    const piecesWithCaptures = [];
    let maxCaptures = 0;

    // Сначала находим максимальное количество захватов
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = board[row][col];

        if (
          ((isPlayer && pieceUtils.isPlayerPiece(piece)) ||
            (!isPlayer && pieceUtils.isBotPiece(piece))) &&
          boardUtils.isDarkSquare(row, col)
        ) {
          // Передаем новый пустой Set() при каждом вызове
          const allCaptures = getAllPossibleCaptures(
            board,
            row,
            col,
            new Set()
          );
          if (allCaptures.length > 0) {
            const maxCapturesForPiece = Math.max(
              ...allCaptures.map((c) => c.capturedPieces)
            );
            maxCaptures = Math.max(maxCaptures, maxCapturesForPiece);
          }
        }
      }
    }

    // Теперь собираем только те фигуры, которые могут захватить максимальное количество
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = board[row][col];

        if (
          ((isPlayer && pieceUtils.isPlayerPiece(piece)) ||
            (!isPlayer && pieceUtils.isBotPiece(piece))) &&
          boardUtils.isDarkSquare(row, col)
        ) {
          // Передаем новый пустой Set() при каждом вызове
          const allCaptures = getAllPossibleCaptures(
            board,
            row,
            col,
            new Set()
          );
          const maxCapturesForPiece =
            allCaptures.length > 0
              ? Math.max(...allCaptures.map((c) => c.capturedPieces))
              : 0;

          if (maxCapturesForPiece === maxCaptures && maxCaptures > 0) {
            const validCaptures = allCaptures.filter(
              (c) => c.capturedPieces === maxCaptures
            );
            piecesWithCaptures.push({ row, col, captures: validCaptures });
          }
        }
      }
    }

    return piecesWithCaptures;
  } catch (error) {
    logger.error("Ошибка при получении фигур с захватами:", error.message);
    return [];
  }
};

// Модифицированная функция получения допустимых ходов с учетом обязательности захватов и правила большинства
export const getValidMovesWithCapturePriority = (board, row, col) => {
  try {
    const piece = board[row][col];
    if (piece === EMPTY || !boardUtils.isDarkSquare(row, col))
      return { moves: [], captures: [], mustCapture: false };

    const isPlayer = pieceUtils.isPlayerPiece(piece);
    const playerHasCaptures = hasCaptures(board, isPlayer);

    if (playerHasCaptures) {
      // Передаем новый пустой Set() при вызове
      const allCaptures = getAllPossibleCaptures(board, row, col, new Set());

      if (allCaptures.length > 0) {
        const allPlayerPieces = getPiecesWithCaptures(board, isPlayer);
        const globalMaxCaptures =
          allPlayerPieces.length > 0
            ? Math.max(
                ...allPlayerPieces.flatMap((p) =>
                  p.captures.map((c) => c.capturedPieces)
                )
              )
            : 0;

        const validCaptures = allCaptures.filter(
          (c) => c.capturedPieces === globalMaxCaptures
        );

        if (validCaptures.length > 0) {
          return {
            moves: validCaptures,
            captures: validCaptures,
            mustCapture: true,
          };
        }
      }

      return { moves: [], captures: [], mustCapture: true };
    } else {
      return getValidMoves(board, row, col);
    }
  } catch (error) {
    logger.error(
      "Ошибка при получении ходов с приоритетом захвата:",
      error.message
    );
    return { moves: [], captures: [], mustCapture: false };
  }
};
