import { describe, expect, it, vi } from "vitest";
import { CORGI, BEAGLE } from "@/shared/config/constants";
import type { PieceMove } from "@/shared/types/game.types";
import { boardWith, pos } from "../helpers/boards";
import { runBotTurn, type BotTurnDeps } from "@/match/turnRunner";

const board = boardWith([
  [3, 2, CORGI],
  [4, 3, BEAGLE],
  [6, 5, BEAGLE],
]);

const doubleCapture: PieceMove = {
  from: pos(3, 2),
  path: [pos(5, 4), pos(7, 6)],
  captures: [pos(4, 3), pos(6, 5)],
};

function deps(overrides: Partial<BotTurnDeps> = {}): BotTurnDeps {
  return {
    board,
    isCurrent: () => true,
    think: () => Promise.resolve(doubleCapture),
    wait: () => Promise.resolve(),
    thinkDelayMs: 0,
    animateLeg: vi.fn(() => Promise.resolve(true)),
    showBoard: vi.fn(),
    commit: vi.fn(),
    ...overrides,
  };
}

describe("runBotTurn", () => {
  it("animates every leg, shows intermediate positions and commits once", async () => {
    const d = deps();
    await expect(runBotTurn(d)).resolves.toBe("committed");
    expect(d.animateLeg).toHaveBeenCalledTimes(2);
    expect(d.animateLeg).toHaveBeenNthCalledWith(1, pos(3, 2), pos(5, 4), true);
    expect(d.animateLeg).toHaveBeenNthCalledWith(2, pos(5, 4), pos(7, 6), true);
    const shown = vi.mocked(d.showBoard).mock.calls[0][0];
    expect(shown[5][4]).toBe(CORGI);
    expect(shown[4][3]).toBe(BEAGLE);
    expect(d.commit).toHaveBeenCalledExactlyOnceWith(doubleCapture);
  });

  it("drops the move if the match changed while the bot was thinking", async () => {
    let current = true;
    const d = deps({
      isCurrent: () => current,
      think: async () => {
        current = false;
        return doubleCapture;
      },
    });
    await expect(runBotTurn(d)).resolves.toBe("cancelled");
    expect(d.animateLeg).not.toHaveBeenCalled();
    expect(d.commit).not.toHaveBeenCalled();
  });

  it("stops when an animation is cleared mid-sequence", async () => {
    const d = deps({
      animateLeg: vi
        .fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false),
    });
    await expect(runBotTurn(d)).resolves.toBe("cancelled");
    expect(d.commit).not.toHaveBeenCalled();
  });

  it("reports a missing move instead of declaring a winner", async () => {
    const d = deps({ think: () => Promise.resolve(null) });
    await expect(runBotTurn(d)).resolves.toBe("no-move");
    expect(d.commit).not.toHaveBeenCalled();
  });

  it("waits for both the search and the minimum think delay", async () => {
    const order: string[] = [];
    const d = deps({
      think: async () => {
        order.push("think");
        return doubleCapture;
      },
      wait: async (ms) => {
        order.push(`wait:${ms}`);
      },
      thinkDelayMs: 700,
    });
    await runBotTurn(d);
    expect(order.slice(0, 2).sort()).toEqual(["think", "wait:700"]);
  });
});
