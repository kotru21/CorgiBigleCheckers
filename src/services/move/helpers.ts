import {
  BOT,
  BOT_KING,
  PLAYER,
  PLAYER_KING,
  EMPTY,
  DIRECTIONS,
} from "@shared/config/constants";
import { boardUtils, validationUtils } from "../../utils/gameHelpers";
import type { Board, Move } from "@shared/types/game.types";

export const isEnemyPiece = (
  piece: string | null,
  isPlayer: boolean
): boolean => {
  if (isPlayer) {
    return piece === BOT || piece === BOT_KING;
  }
  return piece === PLAYER || piece === PLAYER_KING;
};

export const getPieceInfo = (piece: string | null) => {
  const isPlayer = piece === PLAYER || piece === PLAYER_KING;
  const isKing = piece === PLAYER_KING || piece === BOT_KING;
  return { isPlayer, isKing } as const;
};

export const getMoveDirections = (isPlayer: boolean, isKing: boolean) => {
  if (isKing) return DIRECTIONS.KING;
  return isPlayer ? DIRECTIONS.PLAYER : DIRECTIONS.BOT;
};

export const createTempBoard = (
  board: Board,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  capturedRow?: number,
  capturedCol?: number
): Board => {
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
};

export type CaptureResolver = (
  board: Board,
  row: number,
  col: number,
  visited: Set<string>
) => Move[];

export const createCaptureMove = (
  toRow: number,
  toCol: number,
  capturedRow: number,
  capturedCol: number,
  continuedCaptures: Move[]
): Move => {
  const maxContinuedCaptures =
    continuedCaptures.length > 0
      ? Math.max(...continuedCaptures.map((c) => c.capturedPieces ?? 0))
      : 0;

  const bestContinuation = continuedCaptures.find(
    (c) => (c.capturedPieces ?? 0) === maxContinuedCaptures
  );

  return {
    row: toRow,
    col: toCol,
    capturedRow,
    capturedCol,
    capturedPieces: 1 + maxContinuedCaptures,
    path: [
      { row: toRow, col: toCol, capturedRow, capturedCol },
      ...(bestContinuation?.path ?? []),
    ],
  };
};

export const findKingCaptures = (
  board: Board,
  row: number,
  col: number,
  rowDir: number,
  colDir: number,
  piece: string | null,
  isPlayer: boolean,
  visited: Set<string>,
  resolveCaptures: CaptureResolver
): Move[] => {
  const captures: Move[] = [];
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
        const continuedCaptures = resolveCaptures(
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

export const findRegularCaptures = (
  board: Board,
  row: number,
  col: number,
  rowDir: number,
  colDir: number,
  piece: string | null,
  isPlayer: boolean,
  visited: Set<string>,
  resolveCaptures: CaptureResolver
): Move[] => {
  const captures: Move[] = [];
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
      const continuedCaptures = resolveCaptures(
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
