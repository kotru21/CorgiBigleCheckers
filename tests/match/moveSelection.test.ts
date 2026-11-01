import { describe, expect, it } from "vitest";
import { CORGI, BEAGLE } from "@/shared/config/constants";
import { boardWith, pos } from "../helpers/boards";
import { CLASSIC_RULES, getLegalMoves } from "@/engine";
import {
  advanceSelection,
  selectionCaptured,
  selectionSquare,
  selectionTargets,
  startSelection,
} from "@/match/moveSelection";

const forkBoard = () =>
  boardWith([
    [6, 5, BEAGLE],
    [5, 4, CORGI],
    [3, 2, CORGI],
    [3, 4, CORGI],
  ]);

describe("moveSelection", () => {
  it("collects candidates of the selected piece only", () => {
    const legal = getLegalMoves(forkBoard(), BEAGLE, CLASSIC_RULES);
    expect(startSelection(legal, pos(6, 5))?.candidates).toHaveLength(2);
    expect(startSelection(legal, pos(9, 0))).toBeNull();
  });

  it("walks a capture sequence step by step until it is complete", () => {
    const legal = getLegalMoves(forkBoard(), BEAGLE, CLASSIC_RULES);
    const start = startSelection(legal, pos(6, 5))!;
    expect(selectionTargets(start)).toEqual([pos(4, 3)]);

    const first = advanceSelection(start, pos(4, 3))!;
    expect(first.completed).toBeNull();
    expect(selectionSquare(first.selection)).toEqual(pos(4, 3));
    expect(selectionCaptured(first.selection)).toEqual([pos(5, 4)]);
    expect(
      selectionTargets(first.selection).sort((a, b) => a.col - b.col)
    ).toEqual([pos(2, 1), pos(2, 5)]);

    const second = advanceSelection(first.selection, pos(2, 5))!;
    expect(second.completed?.path).toEqual([pos(4, 3), pos(2, 5)]);
    expect(second.completed?.captures).toEqual([pos(5, 4), pos(3, 4)]);
  });

  it("rejects squares outside the remaining sequences", () => {
    const legal = getLegalMoves(forkBoard(), BEAGLE, CLASSIC_RULES);
    const start = startSelection(legal, pos(6, 5))!;
    const first = advanceSelection(start, pos(4, 3))!;
    expect(advanceSelection(first.selection, pos(5, 6))).toBeNull();
    expect(advanceSelection(start, pos(2, 1))).toBeNull();
  });

  it("a quiet move completes in one step", () => {
    const board = boardWith([
      [6, 5, BEAGLE],
      [0, 1, CORGI],
    ]);
    const start = startSelection(
      getLegalMoves(board, BEAGLE, CLASSIC_RULES),
      pos(6, 5)
    )!;
    expect(advanceSelection(start, pos(5, 4))?.completed?.path).toEqual([
      pos(5, 4),
    ]);
  });
});
