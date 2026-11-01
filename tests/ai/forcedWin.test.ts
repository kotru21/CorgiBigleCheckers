import { describe, expect, it } from "vitest";
import { BEAGLE, CORGI } from "@/shared/config/constants";
import { boardWith } from "../helpers/boards";
import { CLASSIC_RULES } from "@/engine";
import { forcedWinPlies } from "@/ai";

describe("forcedWinPlies", () => {
  it("находит выигрыш в один ход", () => {
    const board = boardWith([
      [6, 1, BEAGLE],
      [5, 2, CORGI],
    ]);
    expect(forcedWinPlies(board, BEAGLE, BEAGLE, CLASSIC_RULES, 3)).toBe(1);
  });

  it("ноль полуходов, если соперник уже заперт", () => {
    const board = boardWith([
      [8, 9, CORGI],
      [9, 8, BEAGLE],
      [7, 6, BEAGLE],
    ]);
    expect(forcedWinPlies(board, BEAGLE, CORGI, CLASSIC_RULES, 3)).toBe(0);
  });

  it("возвращает null, если форсированного выигрыша нет", () => {
    const board = boardWith([
      [9, 0, BEAGLE],
      [0, 9, CORGI],
    ]);
    expect(forcedWinPlies(board, BEAGLE, BEAGLE, CLASSIC_RULES, 3)).toBeNull();
  });
});
