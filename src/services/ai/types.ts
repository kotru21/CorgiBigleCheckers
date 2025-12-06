export interface SearchMove {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  isCapture?: boolean;
  mustCapture?: boolean;
}

export interface MinimaxResultInternal {
  score: number;
  move: SearchMove | null;
}

export type TranspositionTable = Map<string, MinimaxResultInternal>;
