import {
  BOARD_SIZE,
  BOT,
  BOT_KING,
  PLAYER,
  PLAYER_KING,
  EMPTY,
} from "@shared/config/constants";
import { pieceUtils, boardUtils, validationUtils } from "../utils/gameHelpers";
import { logger } from "../utils/logger";
import type { Board, Move } from "@shared/types/game.types";
import {
  findKingCaptures,
  findRegularCaptures,
  getMoveDirections,
  getPieceInfo,
} from "./move/helpers";

// Поиск всех возможных захватов для фигуры (правило большинства)
export const getAllPossibleCaptures = (
  board: Board,
  row: number,
  col: number,
  visited: Set<string> | string[] = new Set()
): Move[] => {
  const visitedSet =
    visited instanceof Set ? new Set(visited) : new Set(visited);
  const piece = board[row][col];

  if (piece === EMPTY || visitedSet.has(`${row}-${col}`)) {
    return [];
  }

  try {
    visitedSet.add(`${row}-${col}`);
    const { isPlayer, isKing } = getPieceInfo(piece);
    const directions = getMoveDirections(isPlayer, isKing);
    const captures: Move[] = [];

    for (const [rowDir, colDir] of directions) {
      const resolver = (
        nextBoard: Board,
        nextRow: number,
        nextCol: number,
        nextVisited: Set<string>
      ) => getAllPossibleCaptures(nextBoard, nextRow, nextCol, nextVisited);

      if (isKing) {
        captures.push(
          ...findKingCaptures(
            board,
            row,
            col,
            rowDir,
            colDir,
            piece,
            isPlayer,
            visitedSet,
            resolver
          )
        );
      } else {
        captures.push(
          ...findRegularCaptures(
            board,
            row,
            col,
            rowDir,
            colDir,
            piece,
            isPlayer,
            visitedSet,
            resolver
          )
        );
      }
    }

    return captures;
  } catch (error) {
    logger.error("Ошибка при поиске захватов:", (error as Error).message);
    return [];
  }
};

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
  const isKing = pieceUtils.isKing(piece);

  if (!isKing && (rowDiff === 2 || colDiff === 2)) {
    const capturedRow = fromRow + Math.sign(toRow - fromRow);
    const capturedCol = fromCol + Math.sign(toCol - fromCol);
    newBoard[capturedRow][capturedCol] = EMPTY;
  } else if (isKing && (rowDiff > 1 || colDiff > 1)) {
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

// Получить валидные ходы для конкретной фигуры
export const getValidMoves = (board: Board, row: number, col: number) => {
  const piece = board[row][col];
  const moves: Move[] = [];

  if (piece === EMPTY || !boardUtils.isDarkSquare(row, col)) {
    return { moves: [], captures: [], mustCapture: false } as const;
  }

  const { isPlayer, isKing } = getPieceInfo(piece);
  const allCaptures = getAllPossibleCaptures(board, row, col, new Set());

  if (allCaptures.length > 0) {
    const maxCaptured = Math.max(
      ...allCaptures.map((c) => c.capturedPieces ?? 0)
    );
    const captures = allCaptures.filter(
      (c) => (c.capturedPieces ?? 0) === maxCaptured
    );
    return { moves: captures, captures, mustCapture: true } as const;
  }

  const moveDirections = getMoveDirections(isPlayer, isKing);

  moveDirections.forEach(([rowDir, colDir]) => {
    if (isKing) {
      let distance = 1;
      while (true) {
        const newRow = row + rowDir * distance;
        const newCol = col + colDir * distance;

        if (!boardUtils.isValidPosition(newRow, newCol)) break;
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

  return { moves, captures: [], mustCapture: false } as const;
};

export const hasCaptures = (board: Board, isPlayer: boolean) => {
  try {
    let maxCaptures = 0;

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = board[row][col];

        if (
          ((isPlayer && pieceUtils.isPlayerPiece(piece)) ||
            (!isPlayer && pieceUtils.isBotPiece(piece))) &&
          boardUtils.isDarkSquare(row, col)
        ) {
          const allCaptures = getAllPossibleCaptures(
            board,
            row,
            col,
            new Set()
          );
          if (allCaptures.length > 0) {
            const maxCapturesForPiece = Math.max(
              ...allCaptures.map((c) => c.capturedPieces ?? 0)
            );
            maxCaptures = Math.max(maxCaptures, maxCapturesForPiece);
          }
        }
      }
    }

    return maxCaptures > 0;
  } catch (error) {
    logger.error("Ошибка при проверке захватов:", (error as Error).message);
    return false;
  }
};

export const getPiecesWithCaptures = (board: Board, isPlayer: boolean) => {
  try {
    const piecesWithCaptures: Array<{
      row: number;
      col: number;
      captures: Move[];
    }> = [];
    let maxCaptures = 0;

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = board[row][col];

        if (
          ((isPlayer && pieceUtils.isPlayerPiece(piece)) ||
            (!isPlayer && pieceUtils.isBotPiece(piece))) &&
          boardUtils.isDarkSquare(row, col)
        ) {
          const allCaptures = getAllPossibleCaptures(
            board,
            row,
            col,
            new Set()
          );
          if (allCaptures.length > 0) {
            const maxCapturesForPiece = Math.max(
              ...allCaptures.map((c) => c.capturedPieces ?? 0)
            );
            maxCaptures = Math.max(maxCaptures, maxCapturesForPiece);
          }
        }
      }
    }

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = board[row][col];

        if (
          ((isPlayer && pieceUtils.isPlayerPiece(piece)) ||
            (!isPlayer && pieceUtils.isBotPiece(piece))) &&
          boardUtils.isDarkSquare(row, col)
        ) {
          const allCaptures = getAllPossibleCaptures(
            board,
            row,
            col,
            new Set()
          );
          const maxCapturesForPiece =
            allCaptures.length > 0
              ? Math.max(...allCaptures.map((c) => c.capturedPieces ?? 0))
              : 0;

          if (maxCapturesForPiece === maxCaptures && maxCaptures > 0) {
            const validCaptures = allCaptures.filter(
              (c) => (c.capturedPieces ?? 0) === maxCaptures
            );
            piecesWithCaptures.push({ row, col, captures: validCaptures });
          }
        }
      }
    }

    return piecesWithCaptures;
  } catch (error) {
    logger.error(
      "Ошибка при получении фигур с захватами:",
      (error as Error).message
    );
    return [];
  }
};

export const getValidMovesWithCapturePriority = (
  board: Board,
  row: number,
  col: number
) => {
  try {
    const piece = board[row][col];
    if (piece === EMPTY || !boardUtils.isDarkSquare(row, col)) {
      return { moves: [], captures: [], mustCapture: false } as const;
    }

    const isPlayer = pieceUtils.isPlayerPiece(piece);
    const playerHasCaptures = hasCaptures(board, isPlayer);

    if (playerHasCaptures) {
      const allCaptures = getAllPossibleCaptures(board, row, col, new Set());

      if (allCaptures.length > 0) {
        const allPlayerPieces = getPiecesWithCaptures(board, isPlayer);
        const globalMaxCaptures =
          allPlayerPieces.length > 0
            ? Math.max(
                ...allPlayerPieces.flatMap((p) =>
                  p.captures.map((c) => c.capturedPieces ?? 0)
                )
              )
            : 0;

        const validCaptures = allCaptures.filter(
          (c) => (c.capturedPieces ?? 0) === globalMaxCaptures
        );

        if (validCaptures.length > 0) {
          return {
            moves: validCaptures,
            captures: validCaptures,
            mustCapture: true,
          } as const;
        }
      }

      return { moves: [], captures: [], mustCapture: true } as const;
    }

    return getValidMoves(board, row, col);
  } catch (error) {
    logger.error(
      "Ошибка при получении ходов с приоритетом захвата:",
      (error as Error).message
    );
    return { moves: [], captures: [], mustCapture: false } as const;
  }
};
