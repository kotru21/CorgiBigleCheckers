import {
  BOARD_SIZE,
  BOT,
  BOT_KING,
  PLAYER,
  PLAYER_KING,
} from "@shared/config/constants";
import { getAllPossibleCaptures } from "../MoveService";
import { boardUtils } from "../../utils/gameHelpers";
import { logger } from "../../utils/logger";
import type { Board } from "@shared/types/game.types";

export const evaluateBoard = (board: Board): number => {
  try {
    let score = 0;
    const { playerPieces, botPieces, playerKings, botKings } =
      boardUtils.countPieces(board);
    let botCaptures = 0;
    let playerCaptures = 0;

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!boardUtils.isDarkSquare(row, col)) {
          continue;
        }

        const piece = board[row][col];

        if (piece === BOT) {
          score += 10 + row;
          const centerDistance = Math.abs(4.5 - col) + Math.abs(4.5 - row);
          score += (5 - centerDistance) / 2;

          const allCaptures = getAllPossibleCaptures(
            board,
            row,
            col,
            new Set()
          );
          botCaptures += allCaptures.length;
        } else if (piece === BOT_KING) {
          score += 30;
          const centerDistance = Math.abs(4.5 - col) + Math.abs(4.5 - row);
          score += 6 - centerDistance;

          const allCaptures = getAllPossibleCaptures(
            board,
            row,
            col,
            new Set()
          );
          botCaptures += allCaptures.length;
        } else if (piece === PLAYER) {
          score -= 10 + (BOARD_SIZE - 1 - row);
          const allCaptures = getAllPossibleCaptures(
            board,
            row,
            col,
            new Set()
          );
          playerCaptures += allCaptures.length;
        } else if (piece === PLAYER_KING) {
          score -= 30;
          const allCaptures = getAllPossibleCaptures(
            board,
            row,
            col,
            new Set()
          );
          playerCaptures += allCaptures.length;
        }
      }
    }

    const pieceDifference = botPieces + botKings - (playerPieces + playerKings);
    score += pieceDifference * 5;

    score += botKings * 10;
    score -= playerKings * 10;

    score += botCaptures * 3;
    score -= playerCaptures * 2;

    if (playerPieces + playerKings === 0) {
      score = 1000;
    }
    if (botPieces + botKings === 0) {
      score = -1000;
    }

    return score;
  } catch (error) {
    logger.error("Ошибка при оценке доски:", (error as Error).message);
    return 0;
  }
};
