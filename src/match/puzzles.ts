import { GAME_MODES } from "@/shared/config/constants";
import { readStored, writeStored } from "@/shared/storage";
import { boardFromDiagram } from "@/engine";
import type { MatchStart } from "./matchLifecycle";
import { PUZZLE_DATA, type Puzzle } from "./puzzleData";
import type { MatchSettings } from "./settings";

export type { Puzzle };

export const PUZZLES = PUZZLE_DATA;

const SOLVED_KEY = "solved-puzzles";

export const findPuzzle = (id: string | null): Puzzle | null =>
  PUZZLES.find((puzzle) => puzzle.id === id) ?? null;

export const nextPuzzle = (id: string): Puzzle | null => {
  const index = PUZZLES.findIndex((puzzle) => puzzle.id === id);
  return index >= 0 ? (PUZZLES[index + 1] ?? null) : null;
};

export const puzzleStart = (puzzle: Puzzle): MatchStart => ({
  board: boardFromDiagram(puzzle.diagram),
  turn: puzzle.toMove,
});

export const puzzleSettings = (puzzle: Puzzle): MatchSettings => ({
  variant: puzzle.variant,
  mode: GAME_MODES.CLASSIC,
  opponent: "bot",
  humanSide: puzzle.toMove,
  puzzleId: puzzle.id,
});

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

export const loadSolvedPuzzles = (): string[] =>
  readStored(SOLVED_KEY, isStringArray) ?? [];

export const markPuzzleSolved = (id: string): void => {
  const solved = loadSolvedPuzzles();
  if (!solved.includes(id)) {
    writeStored(SOLVED_KEY, [...solved, id]);
  }
};
