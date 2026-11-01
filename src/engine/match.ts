import { BEAGLE } from "@/shared/config/constants";
import type {
  Board,
  MatchResult,
  PieceMove,
  Player,
} from "@/shared/types/game.types";
import { applyMove } from "./applyMove";
import { createInitialBoard, opponentOf, samePosition } from "./board";
import {
  advanceDrawTracker,
  createDrawTracker,
  type DrawTracker,
} from "./drawRules";
import { getLegalMoves } from "./moveGeneration";
import type { RuleOptions } from "./rules";

export interface MatchPosition {
  board: Board;
  turn: Player;
  draw: DrawTracker;
}

export interface MoveOutcome {
  position: MatchPosition;
  result: MatchResult | null;
}

export const createMatchPosition = (
  rules: RuleOptions,
  board: Board = createInitialBoard(rules.boardSize),
  turn: Player = BEAGLE
): MatchPosition => ({
  board,
  turn,
  draw: createDrawTracker(board, turn, rules),
});

export const isSameMove = (
  a: Pick<PieceMove, "from" | "path">,
  b: Pick<PieceMove, "from" | "path">
): boolean =>
  samePosition(a.from, b.from) &&
  a.path.length === b.path.length &&
  a.path.every((step, i) => samePosition(step, b.path[i]));

export const findLegalMove = (
  position: MatchPosition,
  move: Pick<PieceMove, "from" | "path">,
  rules: RuleOptions
): PieceMove | null =>
  getLegalMoves(position.board, position.turn, rules).find((candidate) =>
    isSameMove(candidate, move)
  ) ?? null;

export const playMove = (
  position: MatchPosition,
  move: Pick<PieceMove, "from" | "path">,
  rules: RuleOptions
): MoveOutcome => {
  const legal = findLegalMove(position, move, rules);
  if (!legal) {
    throw new Error("Недопустимый ход");
  }

  const board = applyMove(position.board, legal);
  const turn = opponentOf(position.turn);
  const { tracker, draw } = advanceDrawTracker(
    position.draw,
    position.board,
    legal,
    board,
    turn,
    rules
  );

  let result: MatchResult | null = null;
  if (getLegalMoves(board, turn, rules).length === 0) {
    result = { kind: "win", winner: position.turn };
  } else if (draw) {
    result = { kind: "draw", reason: draw };
  }

  return { position: { board, turn, draw: tracker }, result };
};
