import { describe, expect, it } from "vitest";
import {
  CORGI,
  CORGI_KING,
  BEAGLE,
  BEAGLE_KING,
} from "@/shared/config/constants";
import type { Board, PieceMove, Player } from "@/shared/types/game.types";
import { boardWith, pos } from "../helpers/boards";
import { applyMove, CLASSIC_RULES, opponentOf } from "@/engine";
import {
  advanceDrawTracker,
  createDrawTracker,
  type DrawTracker,
} from "@/engine/drawRules";

const quiet = (
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): PieceMove => ({
  from: pos(fromRow, fromCol),
  path: [pos(toRow, toCol)],
  captures: [],
});

function play(board: Board, first: Player, moves: PieceMove[]) {
  let tracker: DrawTracker = createDrawTracker(board, first, CLASSIC_RULES);
  let side = first;
  for (let i = 0; i < moves.length; i++) {
    const after = applyMove(board, moves[i]);
    side = opponentOf(side);
    const step = advanceDrawTracker(
      tracker,
      board,
      moves[i],
      after,
      side,
      CLASSIC_RULES
    );
    tracker = step.tracker;
    board = after;
    if (step.draw) {
      return { draw: step.draw, ply: i + 1 };
    }
  }
  return { draw: null, ply: moves.length };
}

const shuffle = (cycles: number): PieceMove[] => {
  const moves: PieceMove[] = [];
  for (let i = 0; i < cycles; i++) {
    moves.push(
      quiet(9, 2, 8, 1),
      quiet(0, 7, 1, 8),
      quiet(8, 1, 9, 2),
      quiet(1, 8, 0, 7)
    );
  }
  return moves;
};

describe("правила ничьей", () => {
  const withMen = () =>
    boardWith([
      [9, 2, BEAGLE_KING],
      [0, 7, CORGI_KING],
      [6, 5, BEAGLE],
      [6, 7, BEAGLE],
      [3, 4, CORGI],
      [3, 2, CORGI],
    ]);

  it("троекратное повторение позиции", () => {
    expect(play(withMen(), BEAGLE, shuffle(3))).toEqual({
      draw: "repetition",
      ply: 8,
    });
  });

  it("ход простой шашкой сбрасывает историю повторений", () => {
    const moves = [
      ...shuffle(1),
      quiet(6, 5, 5, 4),
      quiet(3, 2, 4, 1),
      ...shuffle(1),
    ];
    expect(play(withMen(), BEAGLE, moves).draw).toBeNull();
  });

  it("счётчик ходов дамками срабатывает на 50-м полуходе и сбрасывается ходом шашки", () => {
    const board = withMen();
    let tracker = createDrawTracker(board, BEAGLE, CLASSIC_RULES);
    tracker = { ...tracker, kingMovePlies: 48 };
    const step1 = advanceDrawTracker(
      tracker,
      board,
      quiet(9, 2, 8, 1),
      applyMove(board, quiet(9, 2, 8, 1)),
      CORGI,
      CLASSIC_RULES
    );
    expect(step1.draw).toBeNull();
    const board2 = applyMove(board, quiet(9, 2, 8, 1));
    const step2 = advanceDrawTracker(
      step1.tracker,
      board2,
      quiet(0, 7, 1, 8),
      applyMove(board2, quiet(0, 7, 1, 8)),
      BEAGLE,
      CLASSIC_RULES
    );
    expect(step2.draw).toBe("kingMoves");

    const reset = advanceDrawTracker(
      tracker,
      board,
      quiet(6, 5, 5, 4),
      applyMove(board, quiet(6, 5, 5, 4)),
      CORGI,
      CLASSIC_RULES
    );
    expect(reset.tracker.kingMovePlies).toBe(0);
  });

  it("три дамки против одной — ничья через 16 ходов каждой стороны", () => {
    const board = boardWith([
      [9, 0, BEAGLE_KING],
      [9, 4, BEAGLE_KING],
      [9, 8, BEAGLE_KING],
      [0, 5, CORGI_KING],
    ]);
    const moves: PieceMove[] = [];
    const playerHops: Array<[number, number, number, number]> = [
      [9, 0, 8, 1],
      [9, 4, 8, 3],
      [9, 8, 8, 9],
      [8, 1, 7, 0],
      [8, 3, 7, 2],
      [8, 9, 7, 8],
      [7, 0, 6, 1],
      [7, 2, 6, 3],
      [7, 8, 6, 9],
      [6, 1, 5, 0],
      [6, 3, 5, 2],
      [6, 9, 5, 8],
      [5, 0, 4, 1],
      [5, 2, 4, 3],
      [5, 8, 4, 9],
      [4, 1, 3, 0],
    ];
    const botHops: Array<[number, number, number, number]> = [
      [0, 5, 1, 6],
      [1, 6, 0, 7],
      [0, 7, 1, 8],
      [1, 8, 0, 9],
      [0, 9, 1, 8],
      [1, 8, 0, 7],
      [0, 7, 1, 6],
      [1, 6, 0, 5],
    ];
    for (let i = 0; i < 16; i++) {
      moves.push(
        quiet(...playerHops[i]),
        quiet(...botHops[i % botHops.length])
      );
    }
    expect(play(board, BEAGLE, moves)).toEqual({ draw: "endgame16", ply: 32 });
  });

  it("дамка против дамки — ничья через 5 ходов каждой стороны", () => {
    const board = boardWith([
      [9, 0, BEAGLE_KING],
      [0, 5, CORGI_KING],
    ]);
    const moves = [
      quiet(9, 0, 8, 1),
      quiet(0, 5, 1, 6),
      quiet(8, 1, 7, 2),
      quiet(1, 6, 2, 7),
      quiet(7, 2, 6, 3),
      quiet(2, 7, 3, 8),
      quiet(6, 3, 5, 2),
      quiet(3, 8, 4, 9),
      quiet(5, 2, 4, 1),
      quiet(4, 9, 5, 8),
    ];
    expect(play(board, BEAGLE, moves)).toEqual({ draw: "endgame5", ply: 10 });
  });

  it("обычный эндшпиль с шашками ничьей не считается", () => {
    const board = boardWith([
      [9, 0, BEAGLE_KING],
      [6, 5, BEAGLE],
      [0, 5, CORGI_KING],
      [3, 4, CORGI],
    ]);
    expect(createDrawTracker(board, BEAGLE, CLASSIC_RULES).endgame).toBeNull();
  });
});
