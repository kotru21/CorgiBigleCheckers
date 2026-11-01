import {
  BEAGLE,
  BEAGLE_KING,
  CORGI,
  CORGI_KING,
  EMPTY,
} from "@/shared/config/constants";
import type {
  Board,
  PieceType,
  Player,
  Position,
} from "@/shared/types/game.types";

export const isBeaglePiece = (piece: PieceType): boolean =>
  piece === BEAGLE || piece === BEAGLE_KING;

export const isCorgiPiece = (piece: PieceType): boolean =>
  piece === CORGI || piece === CORGI_KING;

export const isKing = (piece: PieceType): boolean =>
  piece === BEAGLE_KING || piece === CORGI_KING;

export const ownerOf = (piece: PieceType): Player | null => {
  if (isBeaglePiece(piece)) {
    return BEAGLE;
  }
  if (isCorgiPiece(piece)) {
    return CORGI;
  }
  return null;
};

export const opponentOf = (side: Player): Player =>
  side === BEAGLE ? CORGI : BEAGLE;

export const kingOf = (side: Player): PieceType =>
  side === BEAGLE ? BEAGLE_KING : CORGI_KING;

export const promotionRow = (side: Player, size: number): number =>
  side === BEAGLE ? 0 : size - 1;

export const isDarkSquare = (row: number, col: number): boolean =>
  (row + col) % 2 === 1;

export const samePosition = (a: Position, b: Position): boolean =>
  a.row === b.row && a.col === b.col;

export const copyBoard = (board: Board): Board => board.map((row) => [...row]);

export const createEmptyBoard = (size = 10): Board =>
  Array.from({ length: size }, () =>
    Array.from({ length: size }, (): PieceType => EMPTY)
  );

export const createInitialBoard = (size = 10): Board => {
  const board = createEmptyBoard(size);
  const rows = (size - 2) / 2;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!isDarkSquare(row, col)) {
        continue;
      }
      if (row < rows) {
        board[row][col] = CORGI;
      } else if (row >= size - rows) {
        board[row][col] = BEAGLE;
      }
    }
  }
  return board;
};

export interface Material {
  beagleMen: number;
  beagleKings: number;
  corgiMen: number;
  corgiKings: number;
}

export const countMaterial = (board: Board): Material => {
  const material: Material = {
    beagleMen: 0,
    beagleKings: 0,
    corgiMen: 0,
    corgiKings: 0,
  };
  for (const row of board) {
    for (const piece of row) {
      if (piece === BEAGLE) {
        material.beagleMen++;
      } else if (piece === BEAGLE_KING) {
        material.beagleKings++;
      } else if (piece === CORGI) {
        material.corgiMen++;
      } else if (piece === CORGI_KING) {
        material.corgiKings++;
      }
    }
  }
  return material;
};

const PIECE_CODES: Record<string, string> = {
  [BEAGLE]: "b",
  [BEAGLE_KING]: "B",
  [CORGI]: "c",
  [CORGI_KING]: "C",
};

export const positionKey = (board: Board, sideToMove: Player): string => {
  let key = sideToMove === BEAGLE ? "b:" : "c:";
  const size = board.length;
  for (let row = 0; row < size; row++) {
    for (let col = row % 2 === 0 ? 1 : 0; col < size; col += 2) {
      const piece = board[row][col];
      key += piece === EMPTY ? "." : PIECE_CODES[piece];
    }
  }
  return key;
};

export const boardFromDiagram = (rows: string[]): Board => {
  const size = rows.length;
  const board = createEmptyBoard(size);
  const symbols: Record<string, PieceType> = {
    ".": EMPTY,
    b: BEAGLE,
    B: BEAGLE_KING,
    c: CORGI,
    C: CORGI_KING,
  };
  rows.forEach((line, row) => {
    const cells = line.replace(/\s/g, "");
    if (cells.length !== size) {
      throw new Error(`Строка ${row}: ожидалось ${size} клеток`);
    }
    [...cells].forEach((symbol, col) => {
      const piece = symbols[symbol];
      if (piece === undefined) {
        throw new Error(`Неизвестный символ «${symbol}»`);
      }
      if (piece !== EMPTY && !isDarkSquare(row, col)) {
        throw new Error(`Фигура на светлом поле (${row}, ${col})`);
      }
      board[row][col] = piece;
    });
  });
  return board;
};
