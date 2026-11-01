import { AI_PRESETS } from "@/shared/config/constants";
import type {
  Board,
  Difficulty,
  PieceMove,
  Player,
} from "@/shared/types/game.types";
import type { RuleOptions } from "@/engine";
import { findBestMove, type SearchHistory } from "./search";

export interface BotMoveRequest {
  board: Board;
  side: Player;
  rules: RuleOptions;
  level: Difficulty | "hint";
  history?: SearchHistory;
}

export const computeBotMove = (request: BotMoveRequest): PieceMove | null =>
  findBestMove(request.board, request.side, request.rules, {
    ...AI_PRESETS[request.level],
    ...(request.history && { history: request.history }),
  }).move;
