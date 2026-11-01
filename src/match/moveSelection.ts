import type { PieceMove, Position } from "@/shared/types/game.types";
import { samePosition } from "@/engine";

export interface MoveSelection {
  candidates: PieceMove[];
  step: number;
}

export const startSelection = (
  legalMoves: PieceMove[],
  from: Position
): MoveSelection | null => {
  const candidates = legalMoves.filter((move) => samePosition(move.from, from));
  return candidates.length > 0 ? { candidates, step: 0 } : null;
};

export const selectionSquare = ({
  candidates,
  step,
}: MoveSelection): Position =>
  step === 0 ? candidates[0].from : candidates[0].path[step - 1];

export const selectionTargets = ({
  candidates,
  step,
}: MoveSelection): Position[] => {
  const targets: Position[] = [];
  for (const move of candidates) {
    const target = move.path[step];
    if (target && !targets.some((t) => samePosition(t, target))) {
      targets.push(target);
    }
  }
  return targets;
};

export const selectionCaptured = ({
  candidates,
  step,
}: MoveSelection): Position[] => candidates[0].captures.slice(0, step);

export const isCaptureSelection = ({ candidates }: MoveSelection): boolean =>
  candidates[0].captures.length > 0;

export const advanceSelection = (
  selection: MoveSelection,
  target: Position
): { selection: MoveSelection; completed: PieceMove | null } | null => {
  const candidates = selection.candidates.filter((move) => {
    const next = move.path[selection.step];
    return next !== undefined && samePosition(next, target);
  });
  if (candidates.length === 0) {
    return null;
  }
  const step = selection.step + 1;
  const completed =
    candidates.find((move) => move.path.length === step) ?? null;
  return { selection: { candidates, step }, completed };
};
