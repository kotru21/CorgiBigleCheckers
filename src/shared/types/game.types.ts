export type PieceType =
  "beagle" | "corgi" | "beagle-king" | "corgi-king" | null;

export type Player = "beagle" | "corgi";

export interface Position {
  row: number;
  col: number;
}

export interface PieceMove {
  from: Position;
  path: Position[];
  captures: Position[];
  promotes?: boolean;
}

export type Board = PieceType[][];

export type GameMode = "classic" | "crazy_jumps" | "party_mode" | "turbo";

export type Variant = "international" | "russian";

export type Opponent = "bot" | "human";

export type Difficulty = "easy" | "medium" | "hard";

export type DrawReason =
  "repetition" | "kingMoves" | "endgame16" | "endgame15" | "endgame5";

export type MatchResult =
  | { kind: "win"; winner: Player; byResignation?: boolean }
  | { kind: "draw"; reason: DrawReason };
