import { describe, it, expect } from "vitest";
import {
  EMPTY_OVERLAY,
  getSquareInteractionFlags,
  moveSquares,
  type SquareOverlayInput,
} from "@/match/squareVisualState";

const overlay = (patch: Partial<SquareOverlayInput>): SquareOverlayInput => ({
  ...EMPTY_OVERLAY,
  hoveredSquare: null,
  ...patch,
});

describe("getSquareInteractionFlags", () => {
  it("marks dark squares by coordinates", () => {
    expect(getSquareInteractionFlags(0, 1).isDarkSquare).toBe(true);
    expect(getSquareInteractionFlags(0, 0).isDarkSquare).toBe(false);
  });

  it("detects selection, targets, hint and cursor", () => {
    const flags = getSquareInteractionFlags(
      4,
      5,
      overlay({
        selectedPiece: { row: 4, col: 5 },
        validMoves: [{ row: 4, col: 5 }],
        hintSquares: [{ row: 4, col: 5 }],
        cursor: { row: 4, col: 5 },
      })
    );
    expect(flags).toMatchObject({
      isSelected: true,
      isValidMove: true,
      isHint: true,
      isCursor: true,
    });
  });

  it("moveSquares lists the origin and every stop", () => {
    expect(
      moveSquares({
        from: { row: 6, col: 1 },
        path: [
          { row: 4, col: 3 },
          { row: 2, col: 1 },
        ],
        captures: [],
      })
    ).toEqual([
      { row: 6, col: 1 },
      { row: 4, col: 3 },
      { row: 2, col: 1 },
    ]);
    expect(moveSquares(null)).toEqual([]);
  });
});
