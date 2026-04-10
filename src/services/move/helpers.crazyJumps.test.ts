import { describe, it, expect } from "vitest";
import { PLAYER, BOT, EMPTY } from "@shared/config/constants";
import type { Board } from "@shared/types/game.types";
import { findRegularCaptures } from "./helpers";

const emptyBoard = (): Board =>
  Array.from({ length: 10 }, () => Array(10).fill(EMPTY)) as Board;

describe("findRegularCaptures long men (crazy jumps)", () => {
  it("offers multiple landing squares past a captured man", () => {
    const board = emptyBoard();
    // Тёмные клетки: (row+col) % 2 === 1
    const playerRow = 6;
    const playerCol = 3;
    const enemyRow = 5;
    const enemyCol = 2;
    board[playerRow][playerCol] = PLAYER;
    board[enemyRow][enemyCol] = BOT;
    const rowDir = -1;
    const colDir = -1;

    const noopResolver = () => [] as ReturnType<typeof findRegularCaptures>;

    const classic = findRegularCaptures(
      board,
      playerRow,
      playerCol,
      rowDir,
      colDir,
      PLAYER,
      true,
      new Set(),
      noopResolver,
      { longMenCaptures: false }
    );
    const crazy = findRegularCaptures(
      board,
      playerRow,
      playerCol,
      rowDir,
      colDir,
      PLAYER,
      true,
      new Set(),
      noopResolver,
      { longMenCaptures: true }
    );

    expect(classic.length).toBe(1);
    expect(crazy.length).toBeGreaterThan(1);
  });
});
