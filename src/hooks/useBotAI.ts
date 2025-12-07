import { useEffect } from "react";
import { useGame } from "../store/gameStore";
import { getBestMove } from "../services/AIservice";
import {
  executeMove,
  getValidMovesWithCapturePriority,
} from "../services/MoveService";
import { checkGameStatus } from "../services/BoardService";
import { GAME_CONFIG, GAME_MODES } from "@shared/config/constants";
import { logger } from "../utils/logger";
import type { Board } from "@shared/types/game.types";

export const useBotAI = () => {
  const {
    board,
    setBoard,
    playerTurn,
    setPlayerTurn,
    gameOver,
    setGameOver,
    setGameMessage,
    gameMode,
    setSelectedPiece,
    setValidMoves,
  } = useGame();

  useEffect(() => {
    if (playerTurn || gameOver) {
      return;
    }

    const makeAIMove = async () => {
      try {
        const depth =
          gameMode === GAME_MODES.TURBO
            ? GAME_CONFIG.AI_DEPTH.TURBO
            : GAME_CONFIG.AI_DEPTH.MEDIUM;

        const delay =
          gameMode === GAME_MODES.TURBO
            ? GAME_CONFIG.AI_DELAY.TURBO
            : GAME_CONFIG.AI_DELAY.NORMAL;

        await new Promise((resolve) => setTimeout(resolve, delay));

        const bestMove = getBestMove(board as Board, depth);

        if (bestMove) {
          let currentBoard = board as Board;
          let currentRow = bestMove.fromRow;
          let currentCol = bestMove.fromCol;
          let targetRow = bestMove.toRow;
          let targetCol = bestMove.toCol;

          currentBoard = executeMove(
            currentBoard,
            currentRow,
            currentCol,
            targetRow,
            targetCol
          );

          logger.debug(
            `Бот сделал ход: (${currentRow},${currentCol}) -> (${targetRow},${targetCol})`
          );

          if (bestMove.isCapture) {
            let continueCapturing = true;

            while (continueCapturing) {
              await new Promise((resolve) => setTimeout(resolve, 300));

              const { moves: continuedCaptures, mustCapture } =
                getValidMovesWithCapturePriority(
                  currentBoard,
                  targetRow,
                  targetCol
                );

              if (mustCapture && continuedCaptures.length > 0) {
                const nextCapture = continuedCaptures[0];

                currentRow = targetRow;
                currentCol = targetCol;
                targetRow = nextCapture.row;
                targetCol = nextCapture.col;

                currentBoard = executeMove(
                  currentBoard,
                  currentRow,
                  currentCol,
                  targetRow,
                  targetCol
                );

                logger.debug(
                  `Бот продолжил серию: (${currentRow},${currentCol}) -> (${targetRow},${targetCol})`
                );

                setBoard(currentBoard);
              } else {
                continueCapturing = false;
              }
            }
          }

          setBoard(currentBoard);
          setPlayerTurn(true);
          setSelectedPiece(null);
          setValidMoves([]);
          setGameMessage("Ваш ход! Выберите фигуру для хода.");

          const gameStatus = checkGameStatus(currentBoard);
          if (gameStatus) {
            setGameOver(true);
            const message =
              gameStatus === "beagle"
                ? "Вы победили! Бигли одержали верх над корги!"
                : "Вы проиграли! Корги оказались хитрее!";
            setGameMessage(message);
          }
        } else {
          logger.warn("Бот не смог найти допустимый ход");
          setGameOver(true);
          setGameMessage("Вы победили! У корги нет доступных ходов!");
        }
      } catch (error) {
        logger.error(
          "Ошибка при выполнении хода ботом:",
          (error as Error).message
        );
        setGameMessage("Произошла ошибка. Попробуйте перезапустить игру.");
      }
    };

    void makeAIMove();
  }, [
    board,
    playerTurn,
    gameOver,
    gameMode,
    setBoard,
    setPlayerTurn,
    setGameOver,
    setGameMessage,
    setSelectedPiece,
    setValidMoves,
  ]);
};
