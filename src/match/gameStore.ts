import { create } from "zustand";
import { DIFFICULTIES } from "@/shared/config/constants";
import type { Board, Difficulty, PieceMove } from "@/shared/types/game.types";
import { readStored, writeStored } from "@/shared/storage";
import { opponentOf } from "@/engine";
import { forcedWinPlies } from "@/ai/forcedWin";
import {
  advanceMatch,
  canUndo,
  createMatchSlice,
  humanMovesCount,
  resultMessage,
  turnMessage,
  type MatchSlice,
} from "./matchLifecycle";
import type { MoveSelection } from "./moveSelection";
import { findPuzzle, markPuzzleSolved, puzzleStart } from "./puzzles";
import {
  loadSavedMatch,
  persistMatch,
  replaySavedMatch,
  type SavedMatch,
} from "./savedMatch";
import {
  DEFAULT_SETTINGS,
  isHumanControlled,
  type MatchSettings,
} from "./settings";

const isDifficulty = (value: unknown): value is Difficulty =>
  Object.values(DIFFICULTIES).includes(value as Difficulty);

export type CommitOutcome = "committed" | "rejected";

export interface GameStore extends MatchSlice {
  difficulty: Difficulty;

  beginMatch: (settings: MatchSettings) => void;
  restartMatch: () => void;
  resumeMatch: (saved?: SavedMatch | null) => boolean;
  setDifficulty: (difficulty: Difficulty) => void;
  setGameMessage: (gameMessage: string) => void;
  setSelection: (selection: MoveSelection | null) => void;
  setDisplayBoard: (board: Board | null) => void;
  setHint: (hint: PieceMove | null) => void;
  commitMove: (move: Pick<PieceMove, "from" | "path">) => CommitOutcome;
  undo: () => void;
  resign: () => void;
}

const startOf = (settings: MatchSettings) => {
  const puzzle = findPuzzle(settings.puzzleId);
  return puzzle ? puzzleStart(puzzle) : undefined;
};

const continuesPuzzle = (
  state: MatchSlice,
  next: MatchSlice["board"],
  movedSide: MatchSlice["turn"]
) => {
  const puzzle = findPuzzle(state.settings.puzzleId);
  if (!puzzle) {
    return true;
  }
  const remaining =
    puzzle.moves - (humanMovesCount(state.history, movedSide) + 1);
  return (
    remaining >= 0 &&
    forcedWinPlies(
      next,
      movedSide,
      opponentOf(movedSide),
      state.rules,
      remaining * 2
    ) !== null
  );
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...createMatchSlice(DEFAULT_SETTINGS, 0, 0),
  difficulty: readStored("difficulty", isDifficulty) ?? DIFFICULTIES.MEDIUM,

  beginMatch: (settings) => {
    const { matchId, revision } = get();
    set(
      createMatchSlice(settings, matchId + 1, revision + 1, startOf(settings))
    );
  },

  restartMatch: () => get().beginMatch(get().settings),

  resumeMatch: (saved = loadSavedMatch()) => {
    if (!saved) {
      return false;
    }
    const { matchId, revision } = get();
    const slice = replaySavedMatch(saved, matchId + 1, revision + 1);
    if (!slice) {
      return false;
    }
    set(slice);
    return true;
  },

  setDifficulty: (difficulty) => {
    writeStored("difficulty", difficulty);
    set({ difficulty });
  },

  setGameMessage: (gameMessage) => set({ gameMessage }),

  setSelection: (selection) => set({ selection }),

  setDisplayBoard: (displayBoard) => set({ displayBoard }),

  setHint: (hint) => set({ hint }),

  commitMove: (move) => {
    const state = get();
    if (state.result) {
      return "rejected";
    }
    const progress = advanceMatch(state, move);
    const mover = state.turn;

    if (
      state.settings.puzzleId &&
      isHumanControlled(state.settings, mover) &&
      !progress.result &&
      !continuesPuzzle(state, progress.board, mover)
    ) {
      set({
        revision: state.revision + 1,
        displayBoard: null,
        selection: null,
        hint: null,
        puzzleMistakes: state.puzzleMistakes + 1,
        gameMessage: "Этот ход не ведёт к победе — попробуйте другой",
      });
      return "rejected";
    }

    if (
      state.settings.puzzleId &&
      progress.result?.kind === "win" &&
      progress.result.winner === state.settings.humanSide
    ) {
      markPuzzleSolved(state.settings.puzzleId);
    }

    set({
      ...progress,
      revision: state.revision + 1,
      displayBoard: null,
      selection: null,
      hint: null,
      gameMessage: progress.result
        ? resultMessage(progress.result, state.settings, state.rules)
        : turnMessage(state.settings, progress.turn),
    });
    return "committed";
  },

  undo: () => {
    const state = get();
    if (!canUndo(state.history, state.settings)) {
      return;
    }
    const history = [...state.history];
    let entry = history.pop();
    while (
      entry &&
      state.settings.opponent === "bot" &&
      entry.before.turn !== state.settings.humanSide &&
      history.length > 0
    ) {
      entry = history.pop();
    }
    if (!entry) {
      return;
    }
    set({
      board: entry.before.board,
      turn: entry.before.turn,
      draw: entry.before.draw,
      history,
      result: null,
      revision: state.revision + 1,
      displayBoard: null,
      selection: null,
      hint: null,
      gameMessage: turnMessage(state.settings, entry.before.turn),
    });
  },

  resign: () => {
    const state = get();
    if (state.result) {
      return;
    }
    const loser =
      state.settings.opponent === "human"
        ? state.turn
        : state.settings.humanSide;
    const result = {
      kind: "win",
      winner: opponentOf(loser),
      byResignation: true,
    } as const;
    set({
      result,
      revision: state.revision + 1,
      selection: null,
      displayBoard: null,
      hint: null,
      gameMessage: resultMessage(result, state.settings, state.rules),
    });
  },
}));

useGameStore.subscribe((state, previous) => {
  if (state.revision !== previous.revision) {
    persistMatch(state);
  }
});
