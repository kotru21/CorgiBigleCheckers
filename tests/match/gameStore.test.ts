import { beforeEach, describe, expect, it } from "vitest";
import { BEAGLE, CORGI } from "@/shared/config/constants";
import { getLegalMoves } from "@/engine";
import { useGameStore } from "@/match/gameStore";
import { replaySavedMatch } from "@/match/savedMatch";
import { DEFAULT_SETTINGS, type MatchSettings } from "@/match/settings";

const state = () => useGameStore.getState();

const play = (count: number) => {
  for (let i = 0; i < count; i++) {
    const [move] = getLegalMoves(state().board, state().turn, state().rules);
    state().commitMove(move);
  }
};

const hotSeat: MatchSettings = { ...DEFAULT_SETTINGS, opponent: "human" };

describe("gameStore", () => {
  beforeEach(() => {
    state().beginMatch(DEFAULT_SETTINGS);
  });

  it("each new match gets new matchId and revision", () => {
    const { matchId, revision } = state();
    state().restartMatch();
    expect(state().matchId).toBe(matchId + 1);
    expect(state().revision).toBe(revision + 1);
  });

  it("russian variant starts on an 8×8 board", () => {
    state().beginMatch({ ...DEFAULT_SETTINGS, variant: "russian" });
    expect(state().board).toHaveLength(8);
    expect(state().rules.majorityRule).toBe(false);
  });

  it("commitMove records the move with notation and passes the turn", () => {
    play(1);
    expect(state().turn).toBe(CORGI);
    expect(state().history).toHaveLength(1);
    expect(state().history[0].notation).toMatch(/^\d+-\d+$/);
    expect(state().gameMessage).toMatch(/корги думают/);
  });

  it("commitMove rejects an illegal move and keeps the position", () => {
    const before = state().board;
    expect(() =>
      state().commitMove({
        from: { row: 6, col: 1 },
        path: [{ row: 3, col: 4 }],
      })
    ).toThrow();
    expect(state().board).toBe(before);
  });

  it("undo against the bot returns to the human's previous turn", () => {
    const initial = state().board;
    play(2);
    state().undo();
    expect(state().history).toHaveLength(0);
    expect(state().turn).toBe(BEAGLE);
    expect(state().board).toEqual(initial);
  });

  it("undo in hot-seat takes back a single ply", () => {
    state().beginMatch(hotSeat);
    play(2);
    state().undo();
    expect(state().history).toHaveLength(1);
    expect(state().turn).toBe(CORGI);
  });

  it("undo clears a finished result", () => {
    play(2);
    state().resign();
    expect(state().result).not.toBeNull();
    state().undo();
    expect(state().result).toBeNull();
  });

  it("resignation: against the bot the human loses, in hot-seat the side to move", () => {
    state().resign();
    expect(state().result).toEqual({
      kind: "win",
      winner: CORGI,
      byResignation: true,
    });

    state().beginMatch(hotSeat);
    play(1);
    state().resign();
    expect(state().result).toEqual({
      kind: "win",
      winner: BEAGLE,
      byResignation: true,
    });
  });

  it("a saved match replays to the same position", () => {
    state().beginMatch(hotSeat);
    play(6);
    const replayed = replaySavedMatch(
      {
        version: 1,
        settings: state().settings,
        moves: state().history.map(({ move }) => ({
          from: move.from,
          path: move.path,
        })),
      },
      99,
      99
    );
    expect(replayed?.board).toEqual(state().board);
    expect(replayed?.history.map((h) => h.notation)).toEqual(
      state().history.map((h) => h.notation)
    );
    expect(replayed?.turn).toBe(state().turn);
  });

  it("a corrupted save is rejected", () => {
    expect(
      replaySavedMatch(
        {
          version: 1,
          settings: DEFAULT_SETTINGS,
          moves: [{ from: { row: 6, col: 1 }, path: [{ row: 2, col: 1 }] }],
        },
        1,
        1
      )
    ).toBeNull();
  });
});
