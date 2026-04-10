import { describe, it, expect } from "vitest";
import { BOT, EMPTY, PLAYER, PLAYER_KING } from "@shared/config/constants";
import { buildPieceDescriptors } from "./buildPieceDescriptors";
import type { Board } from "@shared/types/game.types";

function emptyBoard(): Board {
  return Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => EMPTY)
  ) as Board;
}

describe("buildPieceDescriptors", () => {
  it("returns empty list for empty board", () => {
    expect(buildPieceDescriptors(emptyBoard(), null, null)).toEqual([]);
  });

  it("marks player pieces as pointer targets", () => {
    const board = emptyBoard();
    board[3][4] = PLAYER;
    board[3][5] = BOT;
    board[1][2] = PLAYER_KING;
    const list = buildPieceDescriptors(board, null, null);
    const beagle = list.find((p) => p.boardRow === 3 && p.boardCol === 4);
    const corgi = list.find((p) => p.boardRow === 3 && p.boardCol === 5);
    const king = list.find((p) => p.boardRow === 1 && p.boardCol === 2);
    expect(beagle?.pointerTarget).toBe(true);
    expect(corgi?.pointerTarget).toBe(false);
    expect(king?.isKing).toBe(true);
    expect(king?.pointerTarget).toBe(true);
  });

  it("sets animationId when currentAnimation starts from that cell", () => {
    const board = emptyBoard();
    board[2][3] = PLAYER;
    const anim = {
      fromRow: 2,
      fromCol: 3,
      toRow: 4,
      toCol: 5,
      animationId: "test-anim",
    };
    const list = buildPieceDescriptors(board, null, anim);
    expect(list[0]?.animationId).toBe("test-anim");
  });
});
