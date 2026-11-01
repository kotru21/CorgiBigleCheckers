import { describe, it, expect } from "vitest";
import { CORGI, EMPTY, BEAGLE, BEAGLE_KING } from "@/shared/config/constants";
import { buildPieceDescriptors } from "@/scene/buildPieceDescriptors";
import type { Board } from "@/shared/types/game.types";

function emptyBoard(): Board {
  return Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => EMPTY)
  ) as Board;
}

describe("buildPieceDescriptors", () => {
  it("returns empty list for empty board", () => {
    expect(buildPieceDescriptors(emptyBoard(), null, BEAGLE)).toEqual([]);
  });

  it("marks player pieces as pointer targets", () => {
    const board = emptyBoard();
    board[3][4] = BEAGLE;
    board[3][5] = CORGI;
    board[1][2] = BEAGLE_KING;
    const list = buildPieceDescriptors(board, null, BEAGLE);
    const beagle = list.find((p) => p.boardRow === 3 && p.boardCol === 4);
    const corgi = list.find((p) => p.boardRow === 3 && p.boardCol === 5);
    const king = list.find((p) => p.boardRow === 1 && p.boardCol === 2);
    expect(beagle?.pointerTarget).toBe(true);
    expect(corgi?.pointerTarget).toBe(false);
    expect(king?.isKing).toBe(true);
    expect(king?.pointerTarget).toBe(true);
  });

  it("sets animationId when the active move starts from that cell", () => {
    const board = emptyBoard();
    board[2][3] = BEAGLE;
    const anim = { id: "test-anim", fromRow: 2, fromCol: 3 };
    const list = buildPieceDescriptors(board, anim, BEAGLE);
    expect(list[0]?.animationId).toBe("test-anim");
  });

  it("only the controllable side is clickable", () => {
    const board = emptyBoard();
    board[3][4] = BEAGLE;
    board[3][6] = CORGI;
    const list = buildPieceDescriptors(board, null, CORGI);
    expect(list.find((p) => p.type === "corgi")?.pointerTarget).toBe(true);
    expect(list.find((p) => p.type === "beagle")?.pointerTarget).toBe(false);
    expect(
      buildPieceDescriptors(board, null, null).some((p) => p.pointerTarget)
    ).toBe(false);
  });
});
