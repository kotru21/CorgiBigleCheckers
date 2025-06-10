import {
  BOARD_SIZE,
  BOT,
  BOT_KING,
  PLAYER,
  PLAYER_KING,
  EMPTY,
} from "../models/Constants";

// Обновленные направления движения для турецких шашек (горизонталь и вертикаль)
// Для шашек игрока направления вверх и по горизонтали
const playerDirections = [
  [-1, 0], // вверх
  [0, -1], // влево
  [0, 1], // вправо
];

// Для шашек бота направления вниз и по горизонтали
const botDirections = [
  [1, 0], // вниз
  [0, -1], // влево
  [0, 1], // вправо
];

// Все направления для дамок (включая диагонали)
const kingDirections = [
  [-1, 0], // вверх
  [1, 0], // вниз
  [0, -1], // влево
  [0, 1], // вправо
  [-1, -1], // диагональ верх-влево
  [-1, 1], // диагональ верх-право
  [1, -1], // диагональ вниз-влево
  [1, 1], // диагональ вниз-право
];

export const getValidMoves = (board, row, col) => {
  const piece = board[row][col];
  const moves = [];
  const captures = [];

  // Проверяем, что это реальная фигура
  if (piece === EMPTY) return { moves: [], captures: [] };

  const isPlayer = piece === PLAYER || piece === PLAYER_KING;
  const isKing = piece === PLAYER_KING || piece === BOT_KING;

  // Выбираем направления движения в зависимости от типа фигуры
  const moveDirections = isKing
    ? kingDirections
    : isPlayer
    ? playerDirections
    : botDirections;

  // Проверяем захваты и обычные ходы
  moveDirections.forEach(([rowDir, colDir]) => {
    if (isKing) {
      // Логика для дамок
      let distance = 1;
      let foundEnemy = false;
      let enemyRow = -1;
      let enemyCol = -1;

      while (true) {
        const newRow = row + rowDir * distance;
        const newCol = col + colDir * distance;

        // Проверка выхода за границы доски
        if (
          newRow < 0 ||
          newRow >= BOARD_SIZE ||
          newCol < 0 ||
          newCol >= BOARD_SIZE
        ) {
          break;
        }

        const cellPiece = board[newRow][newCol];

        if (cellPiece === EMPTY) {
          if (!foundEnemy) {
            // Обычный ход
            moves.push({ row: newRow, col: newCol });
          } else {
            // Ход после захвата
            captures.push({
              row: newRow,
              col: newCol,
              capturedRow: enemyRow,
              capturedCol: enemyCol,
            });
          }
          distance++;
        } else if (!foundEnemy && isEnemyPiece(cellPiece, isPlayer)) {
          // Нашли вражескую фигуру
          foundEnemy = true;
          enemyRow = newRow;
          enemyCol = newCol;
          distance++;
        } else {
          // Встретили препятствие
          break;
        }
      }
    } else {
      // Логика для обычных шашек
      const newRow = row + rowDir;
      const newCol = col + colDir;

      // Проверка выхода за границы доски
      if (
        newRow < 0 ||
        newRow >= BOARD_SIZE ||
        newCol < 0 ||
        newCol >= BOARD_SIZE
      ) {
        return;
      }

      const cellPiece = board[newRow][newCol];

      if (cellPiece === EMPTY) {
        // Обычный ход
        moves.push({ row: newRow, col: newCol });
      } else if (isEnemyPiece(cellPiece, isPlayer)) {
        // Проверяем возможность захвата
        const jumpRow = newRow + rowDir;
        const jumpCol = newCol + colDir;

        if (
          jumpRow >= 0 &&
          jumpRow < BOARD_SIZE &&
          jumpCol >= 0 &&
          jumpCol < BOARD_SIZE &&
          board[jumpRow][jumpCol] === EMPTY
        ) {
          captures.push({
            row: jumpRow,
            col: jumpCol,
            capturedRow: newRow,
            capturedCol: newCol,
          });
        }
      }
    }
  });

  // В турецких шашках захват обязателен - если есть захваты, возвращаем только их
  if (captures.length > 0) {
    return { moves: captures, captures, mustCapture: true };
  }

  return { moves, captures: [], mustCapture: false };
};

// Вспомогательная функция для определения вражеской фигуры
const isEnemyPiece = (piece, isPlayer) => {
  if (isPlayer) {
    return piece === BOT || piece === BOT_KING;
  } else {
    return piece === PLAYER || piece === PLAYER_KING;
  }
};

export const executeMove = (board, fromRow, fromCol, toRow, toCol) => {
  const newBoard = board.map((row) => [...row]);
  const piece = newBoard[fromRow][fromCol];

  // Перемещение фигуры
  newBoard[toRow][toCol] = piece;
  newBoard[fromRow][fromCol] = EMPTY;

  // Проверяем, был ли это захват
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);
  const isKing = piece === PLAYER_KING || piece === BOT_KING;

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

  return newBoard;
};

// Проверяем, есть ли обязательные захваты для указанного игрока
export const hasCaptures = (board, isPlayer) => {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];

      // Проверяем только фигуры нужного игрока
      if (
        (isPlayer && (piece === PLAYER || piece === PLAYER_KING)) ||
        (!isPlayer && (piece === BOT || piece === BOT_KING))
      ) {
        const { captures } = getValidMoves(board, row, col);
        if (captures.length > 0) {
          return true;
        }
      }
    }
  }
  return false;
};

// Получаем только те фигуры, которые могут делать захваты
export const getPiecesWithCaptures = (board, isPlayer) => {
  const piecesWithCaptures = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];

      // Проверяем только фигуры нужного игрока
      if (
        (isPlayer && (piece === PLAYER || piece === PLAYER_KING)) ||
        (!isPlayer && (piece === BOT || piece === BOT_KING))
      ) {
        const { captures } = getValidMoves(board, row, col);
        if (captures.length > 0) {
          piecesWithCaptures.push({ row, col, captures });
        }
      }
    }
  }

  return piecesWithCaptures;
};

// Модифицированная функция получения допустимых ходов с учетом обязательности захватов
export const getValidMovesWithCapturePriority = (board, row, col) => {
  const piece = board[row][col];
  if (piece === EMPTY) return { moves: [], captures: [], mustCapture: false };

  const isPlayer = piece === PLAYER || piece === PLAYER_KING;

  // Проверяем, есть ли у этого игрока обязательные захваты на доске
  const playerHasCaptures = hasCaptures(board, isPlayer);

  if (playerHasCaptures) {
    // Если есть обязательные захваты, возвращаем только захваты для этой фигуры
    const { captures } = getValidMoves(board, row, col);
    if (captures.length > 0) {
      return { moves: captures, captures, mustCapture: true };
    } else {
      // Эта фигура не может делать захваты, но другие могут
      return { moves: [], captures: [], mustCapture: true };
    }
  } else {
    // Нет обязательных захватов - возвращаем обычные ходы
    return getValidMoves(board, row, col);
  }
};
