import type { Board, PieceMove, Position } from "@/shared/types/game.types";
import { relocatePiece } from "@/engine";

export const LEG_PAUSE_MS = 80;

export interface BotTurnDeps {
  board: Board;
  isCurrent: () => boolean;
  think: () => Promise<PieceMove | null>;
  wait: (ms: number) => Promise<void>;
  thinkDelayMs: number;
  animateLeg: (
    from: Position,
    to: Position,
    isCapture: boolean
  ) => Promise<boolean>;
  showBoard: (board: Board) => void;
  commit: (move: PieceMove) => void;
}

export type BotTurnOutcome = "committed" | "cancelled" | "no-move";

export async function runBotTurn(deps: BotTurnDeps): Promise<BotTurnOutcome> {
  const [move] = await Promise.all([
    deps.think(),
    deps.wait(deps.thinkDelayMs),
  ]);
  if (!deps.isCurrent()) {
    return "cancelled";
  }
  if (!move) {
    return "no-move";
  }

  const isCapture = move.captures.length > 0;
  let shown = deps.board;
  let from = move.from;
  for (let i = 0; i < move.path.length; i++) {
    const to = move.path[i];
    const completed = await deps.animateLeg(from, to, isCapture);
    if (!completed || !deps.isCurrent()) {
      return "cancelled";
    }
    if (i < move.path.length - 1) {
      shown = relocatePiece(shown, from, to);
      deps.showBoard(shown);
      await deps.wait(LEG_PAUSE_MS);
      if (!deps.isCurrent()) {
        return "cancelled";
      }
    }
    from = to;
  }

  deps.commit(move);
  return "committed";
}
