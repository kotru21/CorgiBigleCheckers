import { createInitialBoard } from "../services/BoardService";
import { getModeStartMessage } from "../utils/modeHelpers";
import type {
  Board,
  GameMode,
  Move,
  Position,
} from "@shared/types/game.types";

export interface MatchSliceForMode {
  board: Board;
  gameMode: GameMode;
  playerTurn: boolean;
  gameOver: boolean;
  gameMessage: string;
  selectedPiece: Position | null;
  validMoves: Move[];
}

export function createMatchSliceForMode(mode: GameMode): MatchSliceForMode {
  return {
    board: createInitialBoard() as Board,
    gameMode: mode,
    playerTurn: true,
    gameOver: false,
    gameMessage: getModeStartMessage(mode),
    selectedPiece: null,
    validMoves: [],
  };
}

export interface RestartSlice {
  board: Board;
  playerTurn: boolean;
  gameOver: boolean;
  gameMessage: string;
  selectedPiece: Position | null;
  validMoves: Move[];
}

export function createRestartSliceKeepingMode(
  currentMode: GameMode
): RestartSlice {
  return {
    board: createInitialBoard() as Board,
    playerTurn: true,
    gameOver: false,
    gameMessage: getModeStartMessage(currentMode),
    selectedPiece: null,
    validMoves: [],
  };
}
