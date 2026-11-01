import type { Board, PieceMove, Player } from "@/shared/types/game.types";
import type { AiPreset } from "@/shared/config/constants";
import {
  applyMove,
  getLegalMoves,
  isReversibleMove,
  opponentOf,
  positionKey,
  type RuleOptions,
} from "@/engine";
import { evaluate } from "./evaluate";
import { hashPosition } from "./zobrist";

export const WIN_SCORE = 1_000_000;
const WIN_BOUND = WIN_SCORE - 10_000;
const MAX_CAPTURE_EXTENSION = 12;

const EXACT = 0;
const LOWER = 1;
const UPPER = 2;

interface TableEntry {
  depth: number;
  score: number;
  flag: typeof EXACT | typeof LOWER | typeof UPPER;
  best: number;
}

export interface SearchHistory {
  positionCounts: Record<string, number>;
  kingMovePlies: number;
}

export interface SearchOptions extends AiPreset {
  history?: SearchHistory;
  random?: () => number;
  now?: () => number;
}

export interface SearchResult {
  move: PieceMove | null;
  score: number;
  depth: number;
  nodes: number;
}

class SearchTimeout extends Error {}

const toTable = (score: number, ply: number) =>
  score > WIN_BOUND ? score + ply : score < -WIN_BOUND ? score - ply : score;
const fromTable = (score: number, ply: number) =>
  score > WIN_BOUND ? score - ply : score < -WIN_BOUND ? score + ply : score;

export function findBestMove(
  board: Board,
  side: Player,
  rules: RuleOptions,
  options: SearchOptions
): SearchResult {
  const random = options.random ?? Math.random;
  const now = options.now ?? (() => performance.now());
  const deadline = now() + options.timeLimitMs;
  const table = new Map<number, TableEntry>();
  const gameCounts = options.history?.positionCounts ?? {};
  const pathCounts = new Map<string, number>();
  let nodes = 0;

  const rootMoves = getLegalMoves(board, side, rules);
  if (rootMoves.length === 0) {
    return { move: null, score: -WIN_SCORE, depth: 0, nodes };
  }
  if (rootMoves.length === 1) {
    return { move: rootMoves[0], score: 0, depth: 0, nodes };
  }

  const negamax = (
    position: Board,
    toMove: Player,
    depth: number,
    alpha: number,
    beta: number,
    ply: number,
    kingPlies: number,
    reversible: boolean
  ): number => {
    nodes++;
    if ((nodes & 1023) === 0 && now() > deadline) {
      throw new SearchTimeout();
    }

    let repetitionKey: string | null = null;
    if (reversible) {
      if (kingPlies >= rules.kingMoveDrawPlies) {
        return 0;
      }
      repetitionKey = positionKey(position, toMove);
      const seen =
        (gameCounts[repetitionKey] ?? 0) + (pathCounts.get(repetitionKey) ?? 0);
      if (seen >= 2) {
        return 0;
      }
    }

    const moves = getLegalMoves(position, toMove, rules);
    if (moves.length === 0) {
      return -(WIN_SCORE - ply);
    }
    const capturing = moves[0].captures.length > 0;
    if (depth <= 0 && (!capturing || depth <= -MAX_CAPTURE_EXTENSION)) {
      return evaluate(position, toMove);
    }

    const key = hashPosition(position, toMove);
    const entry = table.get(key);
    if (entry && entry.depth >= depth) {
      const score = fromTable(entry.score, ply);
      if (
        entry.flag === EXACT ||
        (entry.flag === LOWER && score >= beta) ||
        (entry.flag === UPPER && score <= alpha)
      ) {
        return score;
      }
    }

    const order = moves.map((_, i) => i);
    if (entry && entry.best < moves.length) {
      order.splice(entry.best, 1);
      order.unshift(entry.best);
    }

    const alphaStart = alpha;
    let best = -Infinity;
    let bestIndex = order[0];
    if (repetitionKey) {
      pathCounts.set(repetitionKey, (pathCounts.get(repetitionKey) ?? 0) + 1);
    }
    try {
      for (const i of order) {
        const childReversible = isReversibleMove(position, moves[i]);
        const score = -negamax(
          applyMove(position, moves[i]),
          opponentOf(toMove),
          depth - 1,
          -beta,
          -alpha,
          ply + 1,
          childReversible ? kingPlies + 1 : 0,
          childReversible
        );
        if (score > best) {
          best = score;
          bestIndex = i;
        }
        if (best > alpha) {
          alpha = best;
        }
        if (alpha >= beta) {
          break;
        }
      }
    } finally {
      if (repetitionKey) {
        pathCounts.set(repetitionKey, (pathCounts.get(repetitionKey) ?? 1) - 1);
      }
    }

    table.set(key, {
      depth,
      score: toTable(best, ply),
      flag: best <= alphaStart ? UPPER : best >= beta ? LOWER : EXACT,
      best: bestIndex,
    });
    return best;
  };

  let order = rootMoves.map((_, i) => i);
  let scores: number[] = [];
  let exact: boolean[] = [];
  let bestScore = -Infinity;
  let completedDepth = 0;

  for (let depth = 1; depth <= options.maxDepth; depth++) {
    const iterationScores = new Array<number>(rootMoves.length).fill(-Infinity);
    const iterationExact = new Array<boolean>(rootMoves.length).fill(false);
    let iterationBest = -Infinity;

    try {
      for (const i of order) {
        const alpha =
          iterationBest === -Infinity
            ? -Infinity
            : iterationBest - options.randomMargin;
        const reversible = isReversibleMove(board, rootMoves[i]);
        const score = -negamax(
          applyMove(board, rootMoves[i]),
          opponentOf(side),
          depth - 1,
          -Infinity,
          -alpha,
          1,
          reversible ? (options.history?.kingMovePlies ?? 0) + 1 : 0,
          reversible
        );
        iterationScores[i] = score;
        iterationExact[i] = score > alpha;
        if (score > iterationBest) {
          iterationBest = score;
        }
      }
    } catch (error) {
      if (error instanceof SearchTimeout) {
        break;
      }
      throw error;
    }

    scores = iterationScores;
    exact = iterationExact;
    bestScore = iterationBest;
    completedDepth = depth;
    order = [...order].sort((a, b) => scores[b] - scores[a]);

    if (Math.abs(bestScore) > WIN_BOUND) {
      break;
    }
  }

  if (completedDepth === 0) {
    return { move: rootMoves[0], score: 0, depth: 0, nodes };
  }

  const candidates = order.filter(
    (i) =>
      scores[i] === bestScore ||
      (exact[i] && scores[i] >= bestScore - options.randomMargin)
  );
  const pick = candidates[Math.floor(random() * candidates.length)] ?? order[0];

  return {
    move: rootMoves[pick],
    score: scores[pick],
    depth: completedDepth,
    nodes,
  };
}
