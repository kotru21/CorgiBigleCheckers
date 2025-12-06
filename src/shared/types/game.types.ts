export type PieceType =
  | "beagle"
  | "corgi"
  | "beagle-king"
  | "corgi-king"
  | null;

export type Player = "beagle" | "corgi";

export interface Position {
  row: number;
  col: number;
}

export interface CaptureStep {
  row: number;
  col: number;
  capturedRow: number;
  capturedCol: number;
}

export interface Move extends Position {
  capturedPieces?: number;
  path?: CaptureStep[];
  capturedRow?: number;
  capturedCol?: number;
}

export type Board = PieceType[][];

export type GameMode = "classic" | "crazy_jumps" | "party_mode" | "turbo";

export interface GameState {
  board: Board;
  currentPlayer: Player;
  selectedPiece: Position | null;
  validMoves: Move[];
  gameOver: boolean;
  gameMode: GameMode;
  message: string;
  isFullscreen?: boolean;
}

export interface MinimaxResult {
  move: {
    fromRow: number;
    fromCol: number;
    toRow: number;
    toCol: number;
    isCapture?: boolean;
    mustCapture?: boolean;
  } | null;
  score: number;
}

export interface EvaluationScore {
  score: number;
}
