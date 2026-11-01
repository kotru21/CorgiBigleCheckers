import type { Board, Player } from "@/shared/types/game.types";
import {
  applyMove,
  getLegalMoves,
  opponentOf,
  positionKey,
  type RuleOptions,
} from "@/engine";

export function forcedWinPlies(
  board: Board,
  attacker: Player,
  toMove: Player,
  rules: RuleOptions,
  maxPlies: number,
  maxNodes = 500_000
): number | null {
  let nodes = 0;

  const wins = (
    position: Board,
    side: Player,
    plies: number,
    memo: Map<string, boolean>
  ): boolean => {
    if (++nodes > maxNodes) {
      throw new RangeError("forced win search exceeded node budget");
    }
    const key = `${plies}|${positionKey(position, side)}`;
    const cached = memo.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const moves = getLegalMoves(position, side, rules);
    let result: boolean;
    if (moves.length === 0) {
      result = side !== attacker;
    } else if (plies === 0) {
      result = false;
    } else {
      const next = (index: number) =>
        wins(
          applyMove(position, moves[index]),
          opponentOf(side),
          plies - 1,
          memo
        );
      result =
        side === attacker
          ? moves.some((_, i) => next(i))
          : moves.every((_, i) => next(i));
    }
    memo.set(key, result);
    return result;
  };

  try {
    for (let limit = 0; limit <= maxPlies; limit++) {
      if (wins(board, toMove, limit, new Map())) {
        return limit;
      }
    }
  } catch (error) {
    if (error instanceof RangeError) {
      return null;
    }
    throw error;
  }
  return null;
}
