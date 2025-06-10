import {
  BOARD_SIZE,
  BOT,
  BOT_KING,
  PLAYER,
  PLAYER_KING,
  EMPTY,
} from "../models/Constants";

// Направления движения для международных шашек (только диагонали)
// Для шашек игрока направления вперед по диагонали
const playerDirections = [
  [-1, -1], // диагональ вверх-влево
  [-1, 1], // диагональ вверх-вправо
];

// Для шашек бота направления вперед по диагонали
const botDirections = [
  [1, -1], // диагональ вниз-влево
  [1, 1], // диагональ вниз-вправо
];

// Все диагональные направления для дамок
const kingDirections = [
  [-1, -1], // диагональ вверх-влево
  [-1, 1], // диагональ вверх-вправо
  [1, -1], // диагональ вниз-влево
  [1, 1], // диагональ вниз-вправо
];

// Функция для подсчета всех возможных захватов от данной позиции (для правила большинства)
export const getAllPossibleCaptures = (
  board,
  row,
  col,
  visited = new Set()
) => {
  const piece = board[row][col];
  if (piece === EMPTY || visited.has(`${row}-${col}`)) return [];

  visited.add(`${row}-${col}`);
  const isPlayer = piece === PLAYER || piece === PLAYER_KING;
  const isKing = piece === PLAYER_KING || piece === BOT_KING;

  const moveDirections = isKing
    ? kingDirections
    : isPlayer
    ? playerDirections
    : botDirections;
  const allCaptures = [];

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

        if (
          newRow < 0 ||
          newRow >= BOARD_SIZE ||
          newCol < 0 ||
          newCol >= BOARD_SIZE
        ) {
          break;
        }

        if ((newRow + newCol) % 2 === 0) {
          distance++;
          continue;
        }

        const cellPiece = board[newRow][newCol];

        if (cellPiece === EMPTY) {
          if (foundEnemy) {
            // Можем сделать захват - создаем временную доску и ищем продолжения
            const tempBoard = board.map((r) => [...r]);
            tempBoard[newRow][newCol] = piece;
            tempBoard[row][col] = EMPTY;
            tempBoard[enemyRow][enemyCol] = EMPTY;

            const continuedCaptures = getAllPossibleCaptures(
              tempBoard,
              newRow,
              newCol,
              new Set(visited)
            );
            allCaptures.push({
              row: newRow,
              col: newCol,
              capturedRow: enemyRow,
              capturedCol: enemyCol,
              capturedPieces:
                1 +
                (continuedCaptures.length > 0
                  ? Math.max(...continuedCaptures.map((c) => c.capturedPieces))
                  : 0),
              path: [
                {
                  row: newRow,
                  col: newCol,
                  capturedRow: enemyRow,
                  capturedCol: enemyCol,
                },
              ].concat(
                continuedCaptures.length > 0
                  ? continuedCaptures.find(
                      (c) =>
                        c.capturedPieces ===
                        Math.max(
                          ...continuedCaptures.map((cc) => cc.capturedPieces)
                        )
                    ).path
                  : []
              ),
            });
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
    } else {
      // Логика для простых шашек
      const newRow = row + rowDir;
      const newCol = col + colDir;

      if (
        newRow < 0 ||
        newRow >= BOARD_SIZE ||
        newCol < 0 ||
        newCol >= BOARD_SIZE
      ) {
        return;
      }

      if ((newRow + newCol) % 2 === 0) {
        return;
      }

      const cellPiece = board[newRow][newCol];

      if (isEnemyPiece(cellPiece, isPlayer)) {
        const jumpRow = newRow + rowDir;
        const jumpCol = newCol + colDir;

        if (
          jumpRow >= 0 &&
          jumpRow < BOARD_SIZE &&
          jumpCol >= 0 &&
          jumpCol < BOARD_SIZE &&
          (jumpRow + jumpCol) % 2 === 1 &&
          board[jumpRow][jumpCol] === EMPTY
        ) {
          // Создаем временную доску и ищем продолжения
          const tempBoard = board.map((r) => [...r]);
          tempBoard[jumpRow][jumpCol] = piece;
          tempBoard[row][col] = EMPTY;
          tempBoard[newRow][newCol] = EMPTY;

          const continuedCaptures = getAllPossibleCaptures(
            tempBoard,
            jumpRow,
            jumpCol,
            new Set(visited)
          );
          allCaptures.push({
            row: jumpRow,
            col: jumpCol,
            capturedRow: newRow,
            capturedCol: newCol,
            capturedPieces:
              1 +
              (continuedCaptures.length > 0
                ? Math.max(...continuedCaptures.map((c) => c.capturedPieces))
                : 0),
            path: [
              {
                row: jumpRow,
                col: jumpCol,
                capturedRow: newRow,
                capturedCol: newCol,
              },
            ].concat(
              continuedCaptures.length > 0
                ? continuedCaptures.find(
                    (c) =>
                      c.capturedPieces ===
                      Math.max(
                        ...continuedCaptures.map((cc) => cc.capturedPieces)
                      )
                  ).path
                : []
            ),
          });
        }
      }
    }
  });

  return allCaptures;
};

// Модифицированная функция getValidMoves с правилом большинства
export const getValidMoves = (board, row, col) => {
  const piece = board[row][col];
  const moves = [];
  let captures = [];

  // Проверяем, что это реальная фигура и находится на темной клетке
  if (piece === EMPTY || (row + col) % 2 === 0)
    return { moves: [], captures: [] };

  const isPlayer = piece === PLAYER || piece === PLAYER_KING;
  const isKing = piece === PLAYER_KING || piece === BOT_KING;

  // Сначала ищем все возможные захваты для применения правила большинства
  const allCaptures = getAllPossibleCaptures(board, row, col);

  if (allCaptures.length > 0) {
    // Применяем правило большинства - берем только захваты с максимальным количеством фигур
    const maxCaptured = Math.max(...allCaptures.map((c) => c.capturedPieces));
    captures = allCaptures.filter((c) => c.capturedPieces === maxCaptured);

    return { moves: captures, captures, mustCapture: true };
  }

  // Если захватов нет, ищем обычные ходы
  const moveDirections = isKing
    ? kingDirections
    : isPlayer
    ? playerDirections
    : botDirections;

  moveDirections.forEach(([rowDir, colDir]) => {
    if (isKing) {
      // Дамка может ходить на любое расстояние
      let distance = 1;
      while (true) {
        const newRow = row + rowDir * distance;
        const newCol = col + colDir * distance;

        if (
          newRow < 0 ||
          newRow >= BOARD_SIZE ||
          newCol < 0 ||
          newCol >= BOARD_SIZE
        ) {
          break;
        }

        if ((newRow + newCol) % 2 === 0) {
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
      // Простая шашка ходит на одну клетку
      const newRow = row + rowDir;
      const newCol = col + colDir;

      if (
        newRow >= 0 &&
        newRow < BOARD_SIZE &&
        newCol >= 0 &&
        newCol < BOARD_SIZE &&
        (newRow + newCol) % 2 === 1 &&
        board[newRow][newCol] === EMPTY
      ) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  });

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
  // Проверка на превращение в дамку в международных шашках
  if (piece === PLAYER && toRow === 0) {
    newBoard[toRow][toCol] = PLAYER_KING;
  } else if (piece === BOT && toRow === BOARD_SIZE - 1) {
    newBoard[toRow][toCol] = BOT_KING;
  }

  return newBoard;
};

// Проверяем, есть ли обязательные захваты для указанного игрока (с правилом большинства)
export const hasCaptures = (board, isPlayer) => {
  let maxCaptures = 0;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];

      // Проверяем только фигуры нужного игрока на темных клетках
      if (
        ((isPlayer && (piece === PLAYER || piece === PLAYER_KING)) ||
          (!isPlayer && (piece === BOT || piece === BOT_KING))) &&
        (row + col) % 2 === 1
      ) {
        const allCaptures = getAllPossibleCaptures(board, row, col);
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
};

// Получаем только те фигуры, которые могут делать захваты с максимальным количеством (правило большинства)
export const getPiecesWithCaptures = (board, isPlayer) => {
  const piecesWithCaptures = [];
  let maxCaptures = 0;

  // Сначала находим максимальное количество захватов
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];

      if (
        ((isPlayer && (piece === PLAYER || piece === PLAYER_KING)) ||
          (!isPlayer && (piece === BOT || piece === BOT_KING))) &&
        (row + col) % 2 === 1
      ) {
        const allCaptures = getAllPossibleCaptures(board, row, col);
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
        ((isPlayer && (piece === PLAYER || piece === PLAYER_KING)) ||
          (!isPlayer && (piece === BOT || piece === BOT_KING))) &&
        (row + col) % 2 === 1
      ) {
        const allCaptures = getAllPossibleCaptures(board, row, col);
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
};

// Модифицированная функция получения допустимых ходов с учетом обязательности захватов и правила большинства
export const getValidMovesWithCapturePriority = (board, row, col) => {
  const piece = board[row][col];
  if (piece === EMPTY || (row + col) % 2 === 0)
    return { moves: [], captures: [], mustCapture: false };

  const isPlayer = piece === PLAYER || piece === PLAYER_KING;

  // Проверяем, есть ли у этого игрока обязательные захваты на доске
  const playerHasCaptures = hasCaptures(board, isPlayer);

  if (playerHasCaptures) {
    // Получаем все захваты для данной фигуры
    const allCaptures = getAllPossibleCaptures(board, row, col);

    if (allCaptures.length > 0) {
      // Находим максимальное количество захватов среди всех фигур игрока
      const allPlayerPieces = getPiecesWithCaptures(board, isPlayer);
      const globalMaxCaptures =
        allPlayerPieces.length > 0
          ? Math.max(
              ...allPlayerPieces.flatMap((p) =>
                p.captures.map((c) => c.capturedPieces)
              )
            )
          : 0;

      // Возвращаем только те захваты, которые соответствуют правилу большинства
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

    // Эта фигура не может делать захваты максимального размера
    return { moves: [], captures: [], mustCapture: true };
  } else {
    // Нет обязательных захватов - возвращаем обычные ходы
    return getValidMoves(board, row, col);
  }
};
