import {
  CORGI,
  CORGI_KING,
  BEAGLE,
  BEAGLE_KING,
} from "@/shared/config/constants";
import type { Board, Player } from "@/shared/types/game.types";

export const MAN_VALUE = 100;
export const KING_VALUE = 320;

const ADVANCE_BONUS = 3;
const CENTER_BONUS = 4;
const BACK_RANK_BONUS = 5;
const MAIN_DIAGONAL_BONUS = 10;

export const evaluate = (board: Board, side: Player): number => {
  let score = 0;
  const size = board.length;

  for (let row = 0; row < size; row++) {
    for (let col = row % 2 === 0 ? 1 : 0; col < size; col += 2) {
      const piece = board[row][col];
      if (piece === null) {
        continue;
      }
      const central = col >= 2 && col <= size - 3 ? CENTER_BONUS : 0;
      const onMainDiagonal = row + col === size - 1 ? MAIN_DIAGONAL_BONUS : 0;

      if (piece === BEAGLE) {
        score +=
          MAN_VALUE +
          (size - 1 - row) * ADVANCE_BONUS +
          central +
          (row === size - 1 ? BACK_RANK_BONUS : 0);
      } else if (piece === CORGI) {
        score -=
          MAN_VALUE +
          row * ADVANCE_BONUS +
          central +
          (row === 0 ? BACK_RANK_BONUS : 0);
      } else if (piece === BEAGLE_KING) {
        score += KING_VALUE + onMainDiagonal;
      } else if (piece === CORGI_KING) {
        score -= KING_VALUE + onMainDiagonal;
      }
    }
  }

  return side === BEAGLE ? score : -score;
};
