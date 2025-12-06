import { create } from "zustand";
import { createInitialBoard } from "../services/BoardService";
import { GAME_MODES } from "@shared/config/constants";
import type {
  Board,
  GameMode,
  Move,
  Player,
  Position,
} from "../shared/types/game.types";

interface GameStore {
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
  switchTurn: () => void;
}

const initialMessage = "Ваш ход! Вы играете за Биглей.";

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

  resetGame: (message = "Новая игра! Ваш ход!") =>
    set(() => ({
      board: createInitialBoard() as Board,
      gameOver: false,
      playerTurn: true,
      selectedPiece: null,
      validMoves: [],
      gameMessage: message,
    })),

  switchTurn: () => set({ playerTurn: !get().playerTurn }),
}));

export const useGame = <T>(selector: (state: GameStore) => T): T =>
  useGameStore(selector);
