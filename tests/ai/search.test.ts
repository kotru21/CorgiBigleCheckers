import { describe, expect, it } from "vitest";
import { BEAGLE, CORGI, CORGI_KING } from "@/shared/config/constants";
import type { Board, PieceMove, Player } from "@/shared/types/game.types";
import { boardWith } from "../helpers/boards";
import {
  applyMove,
  CLASSIC_RULES,
  createInitialBoard,
  getLegalMoves,
  opponentOf,
  positionKey,
} from "@/engine";
import { isSameMove } from "@/engine/match";
import { evaluate } from "@/ai/evaluate";
import { findBestMove, WIN_SCORE } from "@/ai/search";

const seeded = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
};

const options = (
  overrides: Partial<Parameters<typeof findBestMove>[3]> = {}
) => ({
  maxDepth: 4,
  timeLimitMs: 60_000,
  randomMargin: 0,
  random: seeded(1),
  ...overrides,
});

function plainNegamax(
  board: Board,
  side: Player,
  depth: number,
  ply: number
): number {
  const moves = getLegalMoves(board, side, CLASSIC_RULES);
  if (moves.length === 0) {
    return -(WIN_SCORE - ply);
  }
  if (depth <= 0 && (moves[0].captures.length === 0 || depth <= -12)) {
    return evaluate(board, side);
  }
  let best = -Infinity;
  for (const move of moves) {
    best = Math.max(
      best,
      -plainNegamax(
        applyMove(board, move),
        opponentOf(side),
        depth - 1,
        ply + 1
      )
    );
  }
  return best;
}

function randomPosition(random: () => number, plies: number): Board | null {
  let board = createInitialBoard();
  let side: Player = BEAGLE;
  for (let i = 0; i < plies; i++) {
    const moves = getLegalMoves(board, side, CLASSIC_RULES);
    if (moves.length === 0) {
      return null;
    }
    board = applyMove(board, moves[Math.floor(random() * moves.length)]);
    side = opponentOf(side);
  }
  return side === CORGI ? board : null;
}

describe("findBestMove", () => {
  it("возвращает допустимый ход из начальной позиции", () => {
    const board = applyMove(createInitialBoard(), {
      from: { row: 6, col: 3 },
      path: [{ row: 5, col: 4 }],
      captures: [],
    });
    const { move } = findBestMove(board, CORGI, CLASSIC_RULES, options());
    const legal = getLegalMoves(board, CORGI, CLASSIC_RULES);
    expect(legal.some((m) => isSameMove(m, move as PieceMove))).toBe(true);
  });

  it("не отдаёт шашку даром", () => {
    const board = boardWith([
      [3, 4, CORGI],
      [0, 1, CORGI],
      [5, 2, BEAGLE],
      [9, 8, BEAGLE],
    ]);
    for (let seed = 1; seed <= 5; seed++) {
      const { move } = findBestMove(
        board,
        CORGI,
        CLASSIC_RULES,
        options({ random: seeded(seed) })
      );
      expect(move?.path[0]).not.toEqual({ row: 4, col: 3 });
    }
  });

  it("при одинаковом seed выбирает один и тот же ход", () => {
    const board = createInitialBoard();
    const a = findBestMove(
      board,
      BEAGLE,
      CLASSIC_RULES,
      options({ randomMargin: 30, random: seeded(7) })
    );
    const b = findBestMove(
      board,
      BEAGLE,
      CLASSIC_RULES,
      options({ randomMargin: 30, random: seeded(7) })
    );
    expect(isSameMove(a.move!, b.move!)).toBe(true);
  });

  it("оценка совпадает с полным перебором (альфа-бета и таблица корректны)", () => {
    const random = seeded(42);
    let checked = 0;
    for (let attempt = 0; attempt < 200 && checked < 8; attempt++) {
      const board = randomPosition(random, 10 + Math.floor(random() * 30));
      if (!board || getLegalMoves(board, CORGI, CLASSIC_RULES).length < 2) {
        continue;
      }
      checked++;
      const result = findBestMove(
        board,
        CORGI,
        CLASSIC_RULES,
        options({ maxDepth: 3 })
      );
      expect(result.depth).toBe(3);
      expect(result.score).toBe(plainNegamax(board, CORGI, 3, 0));
    }
    expect(checked).toBe(8);
  });

  it("с перевесом не идёт на троекратное повторение позиции", () => {
    const board = boardWith([
      [0, 1, CORGI_KING],
      [0, 3, CORGI_KING],
      [9, 0, BEAGLE],
    ]);
    const base = findBestMove(
      board,
      CORGI,
      CLASSIC_RULES,
      options({ maxDepth: 3 })
    );
    const repeated = positionKey(applyMove(board, base.move!), BEAGLE);
    const avoiding = findBestMove(
      board,
      CORGI,
      CLASSIC_RULES,
      options({
        maxDepth: 3,
        history: { positionCounts: { [repeated]: 2 }, kingMovePlies: 0 },
      })
    );
    expect(isSameMove(avoiding.move!, base.move!)).toBe(false);
  });

  it("при исчерпанном лимите ходов дамками предпочитает ход шашкой", () => {
    const board = boardWith([
      [0, 1, CORGI_KING],
      [3, 4, CORGI],
      [9, 0, BEAGLE],
    ]);
    const result = findBestMove(
      board,
      CORGI,
      CLASSIC_RULES,
      options({
        maxDepth: 3,
        history: { positionCounts: {}, kingMovePlies: 49 },
      })
    );
    expect(result.move?.from).toEqual({ row: 3, col: 4 });
  });

  it("укладывается в бюджет времени и сообщает досчитанную глубину", () => {
    const board = createInitialBoard();
    let clock = 0;
    const result = findBestMove(
      board,
      BEAGLE,
      CLASSIC_RULES,
      options({ maxDepth: 30, timeLimitMs: 200, now: () => (clock += 5) })
    );
    expect(result.move).not.toBeNull();
    expect(result.depth).toBeGreaterThan(0);
    expect(result.depth).toBeLessThan(30);
  });
});
