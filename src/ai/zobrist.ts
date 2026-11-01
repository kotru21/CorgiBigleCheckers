import {
  CORGI,
  CORGI_KING,
  BEAGLE,
  BEAGLE_KING,
} from "@/shared/config/constants";
import type { Board, Player } from "@/shared/types/game.types";

const PIECE_INDEX: Record<string, number> = {
  [BEAGLE]: 0,
  [BEAGLE_KING]: 1,
  [CORGI]: 2,
  [CORGI_KING]: 3,
};

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  };
}

const next = mulberry32(0x9e3779b9);
const STRIDE = 10;
const SQUARES = STRIDE * STRIDE;
const LOW = Uint32Array.from({ length: SQUARES * 4 }, next);
const HIGH = Uint32Array.from({ length: SQUARES * 4 }, next);
const SIDE_LOW = next();
const SIDE_HIGH = next();

export const hashPosition = (board: Board, sideToMove: Player): number => {
  let low = sideToMove === CORGI ? SIDE_LOW : 0;
  let high = sideToMove === CORGI ? SIDE_HIGH : 0;
  const size = board.length;
  for (let row = 0; row < size; row++) {
    for (let col = row % 2 === 0 ? 1 : 0; col < size; col += 2) {
      const piece = board[row][col];
      if (piece !== null) {
        const index = (row * STRIDE + col) * 4 + PIECE_INDEX[piece];
        low ^= LOW[index];
        high ^= HIGH[index];
      }
    }
  }
  return (high >>> 1) * 2 ** 21 + ((low >>> 0) & 0x1fffff);
};
