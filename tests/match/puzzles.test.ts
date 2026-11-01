import { describe, expect, it } from "vitest";
import { applyMove, getLegalMoves, opponentOf, VARIANT_RULES } from "@/engine";
import { forcedWinPlies } from "@/ai/forcedWin";
import { useGameStore } from "@/match/gameStore";
import { PUZZLES, puzzleSettings, puzzleStart } from "@/match/puzzles";

describe("задачи", () => {
  it.each(PUZZLES.map((p) => [p.id, p] as const))(
    "%s решается ровно за заявленное число ходов единственным первым ходом",
    (_, puzzle) => {
      const rules = VARIANT_RULES[puzzle.variant];
      const { board, turn } = puzzleStart(puzzle);
      expect(board).toHaveLength(rules.boardSize);
      const plies = puzzle.moves * 2 - 1;
      expect(forcedWinPlies(board, turn, turn, rules, plies)).toBe(plies);

      const winning = getLegalMoves(board, turn, rules).filter(
        (move) =>
          forcedWinPlies(
            applyMove(board, move),
            turn,
            opponentOf(turn),
            rules,
            plies - 1
          ) !== null
      );
      expect(winning).toHaveLength(1);
    }
  );

  it("неверный ход отклоняется, верная серия засчитывается", () => {
    const store = () => useGameStore.getState();
    const puzzle = PUZZLES[0];
    store().beginMatch(puzzleSettings(puzzle));
    const human = store().turn;
    const rules = store().rules;

    const wrong = getLegalMoves(store().board, human, rules).find(
      (move) =>
        forcedWinPlies(
          applyMove(store().board, move),
          human,
          opponentOf(human),
          rules,
          puzzle.moves * 2 - 2
        ) === null
    )!;
    const before = store().board;
    expect(store().commitMove(wrong)).toBe("rejected");
    expect(store().board).toBe(before);
    expect(store().puzzleMistakes).toBe(1);

    for (let guard = 0; guard < 20 && !store().result; guard++) {
      const { board, turn } = store();
      const moves = getLegalMoves(board, turn, rules);
      const remaining = puzzle.moves * 2 - store().history.length - 1;
      const move =
        turn === human
          ? moves.find(
              (m) =>
                forcedWinPlies(
                  applyMove(board, m),
                  human,
                  opponentOf(human),
                  rules,
                  remaining
                ) !== null
            )!
          : moves[0];
      expect(store().commitMove(move)).toBe("committed");
    }
    expect(store().result).toEqual({ kind: "win", winner: human });
    expect(store().gameMessage).toBe("Задача решена!");
  });
});
