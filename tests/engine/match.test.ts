import { describe, expect, it } from "vitest";
import { CORGI, BEAGLE, BEAGLE_KING } from "@/shared/config/constants";
import { boardWith, pos } from "../helpers/boards";
import { CLASSIC_RULES, getLegalMoves } from "@/engine";
import { createMatchPosition, playMove } from "@/engine/match";

describe("playMove", () => {
  it("отклоняет недопустимый ход", () => {
    const position = createMatchPosition(CLASSIC_RULES);
    expect(() =>
      playMove(position, { from: pos(6, 1), path: [pos(4, 3)] }, CLASSIC_RULES)
    ).toThrow("Недопустимый ход");
  });

  it("передаёт очередь сопернику", () => {
    const position = createMatchPosition(CLASSIC_RULES);
    const [move] = getLegalMoves(position.board, BEAGLE, CLASSIC_RULES);
    const { position: next, result } = playMove(position, move, CLASSIC_RULES);
    expect(next.turn).toBe(CORGI);
    expect(result).toBeNull();
  });

  it("побеждает тот, кто забрал последнюю фигуру", () => {
    const board = boardWith([
      [6, 1, BEAGLE],
      [5, 2, CORGI],
    ]);
    const position = createMatchPosition(CLASSIC_RULES, board, BEAGLE);
    const [move] = getLegalMoves(board, BEAGLE, CLASSIC_RULES);
    expect(playMove(position, move, CLASSIC_RULES).result).toEqual({
      kind: "win",
      winner: BEAGLE,
    });
  });

  it("побеждает тот, кто запер все фигуры соперника", () => {
    const board = boardWith([
      [8, 9, CORGI],
      [9, 8, BEAGLE],
      [7, 6, BEAGLE_KING],
    ]);
    const position = createMatchPosition(CLASSIC_RULES, board, BEAGLE);
    const move = getLegalMoves(board, BEAGLE, CLASSIC_RULES).find(
      (m) => m.from.row === 7
    )!;
    expect(playMove(position, move, CLASSIC_RULES).result).toEqual({
      kind: "win",
      winner: BEAGLE,
    });
  });
});
