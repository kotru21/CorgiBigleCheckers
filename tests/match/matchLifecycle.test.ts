import { describe, it, expect } from "vitest";
import { BEAGLE, CORGI, GAME_MODES } from "@/shared/config/constants";
import { CLASSIC_RULES, RUSSIAN_RULES } from "@/engine";
import {
  createMatchSlice,
  resultMessage,
  turnMessage,
} from "@/match/matchLifecycle";
import { DEFAULT_SETTINGS } from "@/match/settings";

describe("matchLifecycle", () => {
  it("createMatchSlice starts a fresh match with beagles to move", () => {
    const slice = createMatchSlice(DEFAULT_SETTINGS, 3, 7);
    expect(slice.matchId).toBe(3);
    expect(slice.revision).toBe(7);
    expect(slice.turn).toBe(BEAGLE);
    expect(slice.result).toBeNull();
    expect(slice.history).toEqual([]);
    expect(slice.board.flat().filter(Boolean)).toHaveLength(40);
    expect(slice.gameMessage).toBe("Классика · ваш ход");
  });

  it("turn messages depend on who controls the side", () => {
    expect(turnMessage(DEFAULT_SETTINGS, CORGI)).toBe(
      "Классика · корги думают…"
    );
    expect(turnMessage({ ...DEFAULT_SETTINGS, opponent: "human" }, CORGI)).toBe(
      "Классика · ход корги"
    );
    expect(
      turnMessage(
        { ...DEFAULT_SETTINGS, variant: "russian", mode: GAME_MODES.TURBO },
        BEAGLE
      )
    ).toBe("Русские · Турбо · ваш ход");
  });

  it("result messages", () => {
    const vsBotAsCorgi = { ...DEFAULT_SETTINGS, humanSide: CORGI } as const;
    expect(
      resultMessage({ kind: "win", winner: CORGI }, vsBotAsCorgi, CLASSIC_RULES)
    ).toMatch(/Вы победили! Корги/);
    expect(
      resultMessage(
        { kind: "win", winner: CORGI },
        DEFAULT_SETTINGS,
        CLASSIC_RULES
      )
    ).toMatch(/проиграли/);
    expect(
      resultMessage(
        { kind: "win", winner: BEAGLE, byResignation: true },
        { ...DEFAULT_SETTINGS, opponent: "human" },
        CLASSIC_RULES
      )
    ).toBe("Корги сдались — победили бигли!");
    expect(
      resultMessage(
        { kind: "draw", reason: "kingMoves" },
        DEFAULT_SETTINGS,
        RUSSIAN_RULES
      )
    ).toBe("Ничья: 15 ходов только дамками без взятий");
    expect(
      resultMessage(
        { kind: "win", winner: BEAGLE },
        { ...DEFAULT_SETTINGS, puzzleId: "x" },
        CLASSIC_RULES
      )
    ).toBe("Задача решена!");
  });
});
