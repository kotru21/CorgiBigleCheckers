import { describe, expect, it } from "vitest";
import {
  BEAGLE,
  BEAGLE_KING,
  CORGI,
  CORGI_KING,
} from "@/shared/config/constants";
import { boardWith, pos } from "../helpers/boards";
import {
  applyMove,
  CLASSIC_RULES,
  createDrawTracker,
  createInitialBoard,
  finalSquare,
  getLegalMoves,
  RUSSIAN_RULES,
} from "@/engine";

describe("русские шашки", () => {
  it("доска 8×8, по 12 шашек, у белых 7 первых ходов", () => {
    const board = createInitialBoard(8);
    expect(board).toHaveLength(8);
    expect(board.flat().filter((p) => p === BEAGLE)).toHaveLength(12);
    expect(board.flat().filter((p) => p === CORGI)).toHaveLength(12);
    expect(getLegalMoves(board, BEAGLE, RUSSIAN_RULES)).toHaveLength(7);
  });

  it("нет правила большинства: можно выбрать любую серию", () => {
    const board = boardWith(
      [
        [5, 0, BEAGLE],
        [4, 1, CORGI],
        [2, 1, CORGI],
        [5, 6, BEAGLE],
        [4, 5, CORGI],
      ],
      8
    );
    const counts = getLegalMoves(board, BEAGLE, RUSSIAN_RULES)
      .map((m) => m.captures.length)
      .sort();
    expect(counts).toEqual([1, 2]);
  });

  it("шашка, дошедшая до дамочного поля во время взятия, бьёт дальше как дамка", () => {
    const board = boardWith(
      [
        [2, 1, BEAGLE],
        [1, 2, CORGI],
        [2, 5, CORGI],
        [7, 0, BEAGLE],
      ],
      8
    );
    const moves = getLegalMoves(board, BEAGLE, RUSSIAN_RULES).filter(
      (m) => m.from.row === 2
    );
    expect(moves.map(finalSquare)).toEqual([pos(3, 6), pos(4, 7)]);
    expect(moves.every((m) => m.captures.length === 2 && m.promotes)).toBe(
      true
    );
    expect(applyMove(board, moves[0])[3][6]).toBe(BEAGLE_KING);
  });

  it("дамка обязана встать на поле, с которого бой продолжается", () => {
    const board = boardWith(
      [
        [7, 0, BEAGLE_KING],
        [5, 2, CORGI],
        [2, 3, CORGI],
      ],
      8
    );
    const moves = getLegalMoves(board, BEAGLE, RUSSIAN_RULES);
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every((m) => m.path[0].row === 3 && m.path[0].col === 4)).toBe(
      true
    );
    expect(moves.every((m) => m.captures.length === 2)).toBe(true);
  });

  it("три дамки против одной — ничья через 15 ходов", () => {
    const strong = boardWith(
      [
        [7, 0, BEAGLE_KING],
        [7, 2, BEAGLE_KING],
        [7, 4, BEAGLE_KING],
        [0, 7, CORGI_KING],
      ],
      8
    );
    expect(
      createDrawTracker(strong, BEAGLE, RUSSIAN_RULES).endgame
    ).toMatchObject({
      reason: "endgame15",
      limit: 30,
    });
    const weak = boardWith(
      [
        [7, 0, BEAGLE_KING],
        [7, 2, BEAGLE_KING],
        [0, 7, CORGI_KING],
      ],
      8
    );
    expect(createDrawTracker(weak, BEAGLE, RUSSIAN_RULES).endgame).toBeNull();
    expect(createDrawTracker(weak, BEAGLE, CLASSIC_RULES).endgame?.reason).toBe(
      "endgame5"
    );
  });
});
