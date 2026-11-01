import type { PieceMove, Position } from "@/shared/types/game.types";
import { readStored, removeStored, writeStored } from "@/shared/storage";
import {
  advanceMatch,
  createMatchSlice,
  type MatchSlice,
} from "./matchLifecycle";
import { isMatchSettings, type MatchSettings } from "./settings";

const KEY = "saved-match";

export interface SavedMatch {
  version: 1;
  settings: MatchSettings;
  moves: Array<Pick<PieceMove, "from" | "path">>;
}

const isPosition = (value: unknown): value is Position =>
  typeof value === "object" &&
  value !== null &&
  Number.isInteger((value as Position).row) &&
  Number.isInteger((value as Position).col);

const isSavedMatch = (value: unknown): value is SavedMatch => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    v.version === 1 &&
    isMatchSettings(v.settings) &&
    Array.isArray(v.moves) &&
    v.moves.every(
      (m: unknown) =>
        typeof m === "object" &&
        m !== null &&
        isPosition((m as SavedMatch["moves"][number]).from) &&
        Array.isArray((m as SavedMatch["moves"][number]).path) &&
        (m as SavedMatch["moves"][number]).path.every(isPosition)
    )
  );
};

export const loadSavedMatch = (): SavedMatch | null => {
  const saved = readStored(KEY, isSavedMatch);
  return saved && saved.moves.length > 0 ? saved : null;
};

export const persistMatch = (slice: MatchSlice): void => {
  if (slice.settings.puzzleId) {
    return;
  }
  if (slice.result || slice.history.length === 0) {
    removeStored(KEY);
    return;
  }
  const saved: SavedMatch = {
    version: 1,
    settings: slice.settings,
    moves: slice.history.map(({ move }) => ({
      from: move.from,
      path: move.path,
    })),
  };
  writeStored(KEY, saved);
};

export const replaySavedMatch = (
  saved: SavedMatch,
  matchId: number,
  revision: number
): MatchSlice | null => {
  let slice = createMatchSlice(saved.settings, matchId, revision);
  try {
    for (const move of saved.moves) {
      if (slice.result) {
        return null;
      }
      slice = { ...slice, ...advanceMatch(slice, move) };
    }
  } catch {
    return null;
  }
  return slice;
};
