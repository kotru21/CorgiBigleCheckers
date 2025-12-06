// Re-export from new modular structure
export { getAllPossibleCaptures } from "./move/captures";
export { executeMove } from "./move/executeMove";
export { getValidMoves } from "./move/validMoves";
export {
  hasCaptures,
  getPiecesWithCaptures,
  getValidMovesWithCapturePriority,
} from "./move/capturePriority";
export {
  isEnemyPiece,
  getPieceInfo,
  getMoveDirections,
  createTempBoard,
  createCaptureMove,
  findKingCaptures,
  findRegularCaptures,
  type CaptureResolver,
} from "./move/helpers";
