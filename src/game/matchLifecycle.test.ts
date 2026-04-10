import { describe, it, expect } from "vitest";
import { GAME_MODES } from "@shared/config/constants";
import {
  createMatchSliceForMode,
  createRestartSliceKeepingMode,
} from "./matchLifecycle";

describe("matchLifecycle", () => {
  it("createMatchSliceForMode sets message from mode", () => {
    const classic = createMatchSliceForMode(GAME_MODES.CLASSIC);
    expect(classic.gameMode).toBe(GAME_MODES.CLASSIC);
    expect(classic.gameMessage).toBe("Классика · ваш ход");
    expect(classic.playerTurn).toBe(true);
    expect(classic.gameOver).toBe(false);
    expect(classic.selectedPiece).toBeNull();
    expect(classic.validMoves).toEqual([]);
    expect(classic.board).toHaveLength(10);
    expect(classic.board[0]).toHaveLength(10);
  });

  it("createRestartSliceKeepingMode does not include gameMode", () => {
    const slice = createRestartSliceKeepingMode(GAME_MODES.PARTY_MODE);
    expect(slice.gameMessage).toBe("Вечеринка · ваш ход");
    expect("gameMode" in slice).toBe(false);
  });
});
