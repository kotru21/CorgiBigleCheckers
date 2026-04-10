import { describe, it, expect } from "vitest";
import { getSquareInteractionFlags } from "./squareVisualState";
import type { Move, Position } from "@shared/types/game.types";

describe("getSquareInteractionFlags", () => {
  it("marks dark squares by coordinates", () => {
    expect(getSquareInteractionFlags(0, 1).isDarkSquare).toBe(true);
    expect(getSquareInteractionFlags(0, 0).isDarkSquare).toBe(false);
  });

  it("detects selected piece square", () => {
    const selected: Position = { row: 2, col: 3 };
    const flags = getSquareInteractionFlags(2, 3, {
      selectedPiece: selected,
      validMoves: [] as Move[],
      piecesWithCaptures: [],
      hoveredSquare: null,
    });
    expect(flags.isSelected).toBe(true);
  });

  it("detects valid move target", () => {
    const moves: Move[] = [{ row: 4, col: 5 }];
    const flags = getSquareInteractionFlags(4, 5, {
      selectedPiece: { row: 3, col: 4 },
      validMoves: moves,
      piecesWithCaptures: [],
      hoveredSquare: null,
    });
    expect(flags.isValidMove).toBe(true);
  });
});
