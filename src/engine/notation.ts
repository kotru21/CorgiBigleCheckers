import type { PieceMove, Position } from "@/shared/types/game.types";
import { samePosition } from "./board";
import { finalSquare } from "./moveGeneration";
import type { RuleOptions } from "./rules";

export const squareLabel = (pos: Position, rules: RuleOptions): string => {
  const size = rules.boardSize;
  if (rules.variant === "russian") {
    return `${String.fromCharCode(97 + pos.col)}${size - pos.row}`;
  }
  return String(pos.row * (size / 2) + Math.floor(pos.col / 2) + 1);
};

export const moveNotation = (
  move: PieceMove,
  legalMoves: PieceMove[],
  rules: RuleOptions
): string => {
  const label = (pos: Position) => squareLabel(pos, rules);
  if (move.captures.length === 0) {
    return `${label(move.from)}-${label(finalSquare(move))}`;
  }

  const separator = rules.variant === "russian" ? ":" : "x";
  const ambiguous = legalMoves.some(
    (other) =>
      other !== move &&
      samePosition(other.from, move.from) &&
      samePosition(finalSquare(other), finalSquare(move)) &&
      !other.path.every(
        (step, i) => move.path[i] && samePosition(step, move.path[i])
      )
  );
  const squares =
    rules.variant === "russian" || ambiguous
      ? [move.from, ...move.path]
      : [move.from, finalSquare(move)];
  return squares.map(label).join(separator);
};

export const formatGameRecord = (
  notations: string[],
  firstMoverIsWhite: boolean
): string => {
  const plies = firstMoverIsWhite ? notations : ["...", ...notations];
  const lines: string[] = [];
  for (let i = 0; i < plies.length; i += 2) {
    const pair = plies.slice(i, i + 2).join(" ");
    lines.push(`${i / 2 + 1}. ${pair}`);
  }
  return lines.join(" ");
};
