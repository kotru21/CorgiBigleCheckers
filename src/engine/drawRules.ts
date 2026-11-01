import type {
  Board,
  DrawReason,
  PieceMove,
  Player,
} from "@/shared/types/game.types";
import { countMaterial, isKing, positionKey } from "./board";
import type { RuleOptions } from "./rules";

export interface DrawTracker {
  positionCounts: Record<string, number>;
  kingMovePlies: number;
  endgame: {
    signature: string;
    reason: DrawReason;
    limit: number;
    plies: number;
  } | null;
}

interface Force {
  men: number;
  kings: number;
}

const isLoneKing = (s: Force) => s.men === 0 && s.kings === 1;

const internationalEndgame = (strong: Force) => {
  if (strong.kings === 0) {
    return null;
  }
  const total = strong.men + strong.kings;
  if (total === 3) {
    return { reason: "endgame16" as const, limit: 32 };
  }
  if (total <= 2) {
    return { reason: "endgame5" as const, limit: 10 };
  }
  return null;
};

const russianEndgame = (strong: Force) =>
  strong.kings >= 3 ? { reason: "endgame15" as const, limit: 30 } : null;

const endgameLimit = (board: Board, rules: RuleOptions) => {
  const m = countMaterial(board);
  const beagles = { men: m.beagleMen, kings: m.beagleKings };
  const corgis = { men: m.corgiMen, kings: m.corgiKings };
  const rule =
    rules.variant === "russian" ? russianEndgame : internationalEndgame;

  const found =
    (isLoneKing(corgis) ? rule(beagles) : null) ??
    (isLoneKing(beagles) ? rule(corgis) : null);
  if (!found) {
    return null;
  }
  return {
    ...found,
    signature: `${m.beagleMen}/${m.beagleKings}/${m.corgiMen}/${m.corgiKings}`,
  };
};

export const createDrawTracker = (
  board: Board,
  sideToMove: Player,
  rules: RuleOptions
): DrawTracker => {
  const endgame = endgameLimit(board, rules);
  return {
    positionCounts: { [positionKey(board, sideToMove)]: 1 },
    kingMovePlies: 0,
    endgame: endgame ? { ...endgame, plies: 0 } : null,
  };
};

export const isReversibleMove = (board: Board, move: PieceMove): boolean =>
  move.captures.length === 0 && isKing(board[move.from.row][move.from.col]);

export const advanceDrawTracker = (
  tracker: DrawTracker,
  boardBefore: Board,
  move: PieceMove,
  boardAfter: Board,
  sideToMove: Player,
  rules: RuleOptions
): { tracker: DrawTracker; draw: DrawReason | null } => {
  const reversible = isReversibleMove(boardBefore, move);

  const positionCounts = reversible ? { ...tracker.positionCounts } : {};
  const key = positionKey(boardAfter, sideToMove);
  positionCounts[key] = (positionCounts[key] ?? 0) + 1;

  const kingMovePlies = reversible ? tracker.kingMovePlies + 1 : 0;

  const current = endgameLimit(boardAfter, rules);
  let endgame: DrawTracker["endgame"] = null;
  if (current) {
    endgame =
      tracker.endgame && tracker.endgame.signature === current.signature
        ? { ...tracker.endgame, plies: tracker.endgame.plies + 1 }
        : { ...current, plies: 0 };
  }

  let draw: DrawReason | null = null;
  if (positionCounts[key] >= 3) {
    draw = "repetition";
  } else if (kingMovePlies >= rules.kingMoveDrawPlies) {
    draw = "kingMoves";
  } else if (endgame && endgame.plies >= endgame.limit) {
    draw = endgame.reason;
  }

  return { tracker: { positionCounts, kingMovePlies, endgame }, draw };
};
