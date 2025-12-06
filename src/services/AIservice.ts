// Re-export from new modular structure
export {
  evaluateBoard,
  getAllBotMoves,
  getAllPlayerMoves,
  minimaxAlphaBeta,
  getBestMove,
  clearTranspositionTable,
} from "./ai";

export type { SearchMove, MinimaxResultInternal } from "./ai";
