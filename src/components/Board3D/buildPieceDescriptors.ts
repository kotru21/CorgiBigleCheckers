import { EMPTY } from "@shared/config/constants";
import { pieceUtils } from "../../utils/gameHelpers";
import type { Board, Position } from "@shared/types/game.types";
import type { PieceAnimationInfo } from "@shared/types/pieceAnimation.types";

export interface PieceDescriptor {
  key: string;
  boardRow: number;
  boardCol: number;
  type: "beagle" | "corgi";
  isKing: boolean;
  pointerTarget: boolean;
  animationId: string | null;
}

export function buildPieceDescriptors(
  board: Board,
  selectedPiece: Position | null,
  currentAnimation: PieceAnimationInfo | null | undefined
): PieceDescriptor[] {
  const out: PieceDescriptor[] = [];
  const anim = currentAnimation ?? null;

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = board[row][col];
      if (cell === EMPTY) {
        continue;
      }
      const type = cell.includes("beagle") ? "beagle" : "corgi";
      const isKing = cell.includes("-king");
      const isAnimating =
        anim !== null && anim.fromRow === row && anim.fromCol === col;

      out.push({
        key: `piece-${row}-${col}`,
        boardRow: row,
        boardCol: col,
        type,
        isKing,
        pointerTarget: pieceUtils.isPlayerPiece(cell),
        animationId: isAnimating ? anim.animationId : null,
      });
    }
  }

  return out;
}
