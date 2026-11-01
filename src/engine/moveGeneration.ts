import { BEAGLE, EMPTY } from "@/shared/config/constants";
import type {
  Board,
  PieceMove,
  Player,
  Position,
} from "@/shared/types/game.types";
import { isKing, ownerOf, promotionRow } from "./board";
import type { RuleOptions } from "./rules";

const DIAGONALS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

export const getCaptureSequences = (
  board: Board,
  from: Position,
  rules: RuleOptions
): PieceMove[] => {
  const piece = board[from.row][from.col];
  const side = ownerOf(piece);
  if (side === null) {
    return [];
  }

  const size = board.length;
  const inside = (row: number, col: number) =>
    row >= 0 && row < size && col >= 0 && col < size;
  const startsAsKing = isKing(piece);
  const crownRow = promotionRow(side, size);
  const captured = new Uint8Array(size * size);
  const path: Position[] = [];
  const captures: Position[] = [];
  const result: PieceMove[] = [];

  const findEnemy = (
    row: number,
    col: number,
    dRow: number,
    dCol: number,
    flying: boolean
  ) => {
    let enemyRow = row + dRow;
    let enemyCol = col + dCol;
    if (flying) {
      while (
        inside(enemyRow, enemyCol) &&
        board[enemyRow][enemyCol] === EMPTY
      ) {
        enemyRow += dRow;
        enemyCol += dCol;
      }
    }
    if (!inside(enemyRow, enemyCol)) {
      return null;
    }
    const owner = ownerOf(board[enemyRow][enemyCol]);
    if (
      owner === null ||
      owner === side ||
      captured[enemyRow * size + enemyCol] === 1
    ) {
      return null;
    }
    return { row: enemyRow, col: enemyCol };
  };

  const landingsBeyond = (
    enemy: Position,
    dRow: number,
    dCol: number,
    flying: boolean
  ) => {
    const landings: Position[] = [];
    let row = enemy.row + dRow;
    let col = enemy.col + dCol;
    while (inside(row, col) && board[row][col] === EMPTY) {
      landings.push({ row, col });
      if (!flying && !rules.longMenCaptures) {
        break;
      }
      row += dRow;
      col += dCol;
    }
    return landings;
  };

  const becomesKing = (row: number, flying: boolean) =>
    flying || (rules.promoteDuringCapture && row === crownRow);

  const canCapture = (row: number, col: number, flying: boolean) =>
    DIAGONALS.some(([dRow, dCol]) => {
      const enemy = findEnemy(row, col, dRow, dCol, flying);
      return (
        enemy !== null && landingsBeyond(enemy, dRow, dCol, flying).length > 0
      );
    });

  const search = (
    row: number,
    col: number,
    flying: boolean,
    crowned: boolean
  ) => {
    let extended = false;

    for (const [dRow, dCol] of DIAGONALS) {
      const enemy = findEnemy(row, col, dRow, dCol, flying);
      if (!enemy) {
        continue;
      }
      const landings = landingsBeyond(enemy, dRow, dCol, flying);
      if (landings.length === 0) {
        continue;
      }

      captured[enemy.row * size + enemy.col] = 1;
      const continuing = landings.filter((l) =>
        canCapture(l.row, l.col, becomesKing(l.row, flying))
      );
      for (const landing of continuing.length > 0 ? continuing : landings) {
        extended = true;
        path.push(landing);
        captures.push(enemy);
        search(
          landing.row,
          landing.col,
          becomesKing(landing.row, flying),
          crowned || landing.row === crownRow
        );
        path.pop();
        captures.pop();
      }
      captured[enemy.row * size + enemy.col] = 0;
    }

    if (!extended && path.length > 0) {
      const final = path[path.length - 1];
      const promotes =
        !startsAsKing &&
        (rules.promoteDuringCapture ? crowned : final.row === crownRow);
      result.push({
        from,
        path: [...path],
        captures: [...captures],
        ...(promotes && { promotes }),
      });
    }
  };

  board[from.row][from.col] = EMPTY;
  try {
    search(from.row, from.col, startsAsKing, false);
  } finally {
    board[from.row][from.col] = piece;
  }

  return result;
};

const getQuietMoves = (board: Board, from: Position): PieceMove[] => {
  const piece = board[from.row][from.col];
  const side = ownerOf(piece);
  if (side === null) {
    return [];
  }

  const size = board.length;
  const inside = (row: number, col: number) =>
    row >= 0 && row < size && col >= 0 && col < size;
  const moves: PieceMove[] = [];

  if (isKing(piece)) {
    for (const [dRow, dCol] of DIAGONALS) {
      let row = from.row + dRow;
      let col = from.col + dCol;
      while (inside(row, col) && board[row][col] === EMPTY) {
        moves.push({ from, path: [{ row, col }], captures: [] });
        row += dRow;
        col += dCol;
      }
    }
    return moves;
  }

  const forward = side === BEAGLE ? -1 : 1;
  const crownRow = promotionRow(side, size);
  for (const dCol of [-1, 1]) {
    const row = from.row + forward;
    const col = from.col + dCol;
    if (inside(row, col) && board[row][col] === EMPTY) {
      moves.push({
        from,
        path: [{ row, col }],
        captures: [],
        ...(row === crownRow && { promotes: true }),
      });
    }
  }
  return moves;
};

export const getLegalMoves = (
  board: Board,
  side: Player,
  rules: RuleOptions
): PieceMove[] => {
  const size = board.length;
  let captures: PieceMove[] = [];
  let maxCaptured = 0;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (ownerOf(board[row][col]) !== side) {
        continue;
      }
      for (const sequence of getCaptureSequences(board, { row, col }, rules)) {
        const count = sequence.captures.length;
        if (!rules.majorityRule || count === maxCaptured) {
          captures.push(sequence);
        } else if (count > maxCaptured) {
          captures = [sequence];
        }
        maxCaptured = Math.max(maxCaptured, count);
      }
    }
  }

  if (captures.length > 0) {
    return captures;
  }

  const quiet: PieceMove[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (ownerOf(board[row][col]) === side) {
        quiet.push(...getQuietMoves(board, { row, col }));
      }
    }
  }
  return quiet;
};

export const finalSquare = (move: PieceMove): Position =>
  move.path[move.path.length - 1];
