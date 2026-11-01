import { EMPTY } from "@/shared/config/constants";
import type { Board, Player } from "@/shared/types/game.types";
import type { ActiveMove } from "@/match/animationStore";
import { isKing, ownerOf } from "@/engine";

export interface PieceDescriptor {
  key: string;
  boardRow: number;
  boardCol: number;
  type: Player;
  isKing: boolean;
  pointerTarget: boolean;
  animationId: string | null;
}

export function buildPieceDescriptors(
  board: Board,
  activeMove: Pick<ActiveMove, "id" | "fromRow" | "fromCol"> | null,
  controllableSide: Player | null
): PieceDescriptor[] {
  const out: PieceDescriptor[] = [];

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = board[row][col];
      const owner = ownerOf(cell);
      if (cell === EMPTY || owner === null) {
        continue;
      }
      const isMoving =
        activeMove !== null &&
        activeMove.fromRow === row &&
        activeMove.fromCol === col;

      out.push({
        key: `piece-${row}-${col}`,
        boardRow: row,
        boardCol: col,
        type: owner,
        isKing: isKing(cell),
        pointerTarget: owner === controllableSide,
        animationId: isMoving ? activeMove.id : null,
      });
    }
  }

  return out;
}
