import { create } from "zustand";
import { createInitialBoard } from "../services/BoardService";
import { GAME_MODES } from "@shared/config/constants";
import {
  createMatchSliceForMode,
  createRestartSliceKeepingMode,
} from "../game/matchLifecycle";
import type {
  Board,
  GameMode,
  Move,
  Position,
} from "../shared/types/game.types";

export interface GameStore {
  board: Board;
  gameMode: GameMode;
  playerTurn: boolean; // true = player, false = bot
  selectedPiece: Position | null;
  validMoves: Move[];
  gameOver: boolean;
  gameMessage: string;
  isFullscreen: boolean;

  setBoard: (board: Board) => void;
  setGameMode: (gameMode: GameMode) => void;
  setPlayerTurn: (playerTurn: boolean) => void;
  setSelectedPiece: (selectedPiece: Position | null) => void;
  setValidMoves: (validMoves: Move[]) => void;
  setGameOver: (gameOver: boolean) => void;
  setGameMessage: (gameMessage: string) => void;
  setIsFullscreen: (isFullscreen: boolean) => void;

  resetGame: (message?: string) => void;
  beginMatch: (mode: GameMode) => void;
  restartMatch: () => void;
  switchTurn: () => void;
}

const initialMessage = "Вы за биглей · ваш ход";

export const useGameStore = create<GameStore>((set, get) => ({
  board: createInitialBoard() as Board,
  gameMode: GAME_MODES.CLASSIC as GameMode,
  playerTurn: true,
  selectedPiece: null,
  validMoves: [],
  gameOver: false,
  gameMessage: initialMessage,
  isFullscreen: false,

  setBoard: (board) => set({ board }),
  setGameMode: (gameMode) => set({ gameMode }),
  setPlayerTurn: (playerTurn) => set({ playerTurn }),
  setSelectedPiece: (selectedPiece) => set({ selectedPiece }),
  setValidMoves: (validMoves) => set({ validMoves }),
  setGameOver: (gameOver) => set({ gameOver }),
  setGameMessage: (gameMessage) => set({ gameMessage }),
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),

  resetGame: (message = "Новая партия · ваш ход") =>
    set((state) => ({
      ...state,
      ...createRestartSliceKeepingMode(state.gameMode),
      gameMessage: message,
    })),

  beginMatch: (mode) => set(() => createMatchSliceForMode(mode)),

  restartMatch: () =>
    set((state) => ({
      ...state,
      ...createRestartSliceKeepingMode(state.gameMode),
    })),

  switchTurn: () => set({ playerTurn: !get().playerTurn }),
}));

// Правильная перегрузка хука без условного вызова
export function useGame(): GameStore;
export function useGame<T>(selector: (state: GameStore) => T): T;
export function useGame<T>(selector?: (state: GameStore) => T): T | GameStore {
  const store = useGameStore();
  if (selector) {
    return selector(store);
  }
  return store;
}
