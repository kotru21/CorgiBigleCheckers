import { useEffect, useRef, useCallback } from "react";
import { useGame } from "../store/gameStore";
import { useAnimationStore } from "../store/animationStore";
import { getBestMove } from "../services/AIservice";
import {
  executeMove,
  getValidMovesWithCapturePriority,
} from "../services/MoveService";
import { checkGameStatus } from "../services/BoardService";
import { GAME_CONFIG, GAME_MODES } from "@shared/config/constants";
import { logger } from "../utils/logger";
import type { Board } from "@shared/types/game.types";
import type { PieceAnimationInfo } from "../components/Board3D";

interface UseBotAIProps {
  setCurrentAnimation: (animation: PieceAnimationInfo | null) => void;
}

export const useBotAI = ({ setCurrentAnimation }: UseBotAIProps) => {
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

  const { startAnimation, isAnimating } = useAnimationStore();

  const isProcessingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const boardRef = useRef(board);

  // Обновляем ref при изменении board
  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  // Функция для выполнения одного хода с анимацией
  const animateMove = useCallback(
    (
      currentBoard: Board,
      fromRow: number,
      fromCol: number,
      toRow: number,
      toCol: number,
      isCapture: boolean
    ): Promise<Board> => {
      return new Promise((resolve) => {
        const animationId = startAnimation(
          fromRow,
          fromCol,
          toRow,
          toCol,
          isCapture,
          () => {
            // После завершения анимации обновляем доску
            const newBoard = executeMove(
              currentBoard,
              fromRow,
              fromCol,
              toRow,
              toCol
            );
            setBoard(newBoard);
            setCurrentAnimation(null);
            resolve(newBoard);
          }
        );

        // Устанавливаем текущую анимацию
        setCurrentAnimation({
          fromRow,
          fromCol,
          toRow,
          toCol,
          animationId,
        });
      });
    },
    [startAnimation, setBoard, setCurrentAnimation]
  );

  useEffect(() => {
    // Сбрасываем флаг когда ход переходит к игроку
    if (playerTurn) {
      hasMovedRef.current = false;
    }
  }, [playerTurn]);

  useEffect(() => {
    // Не запускаем если: ход игрока, игра окончена, уже обрабатываем, уже сделали ход, или идёт анимация
    if (
      playerTurn ||
      gameOver ||
      isProcessingRef.current ||
      hasMovedRef.current ||
      isAnimating
    ) {
      return;
    }

    isProcessingRef.current = true;

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

        const currentBoard = boardRef.current;
        if (!currentBoard || playerTurn || gameOver) {
          isProcessingRef.current = false;
          return;
        }

        const bestMove = getBestMove(currentBoard as Board, depth);

        if (!bestMove) {
          logger.warn("Бот не смог найти допустимый ход");
          setGameOver(true);
          setGameMessage("Вы победили! У корги нет доступных ходов!");
          isProcessingRef.current = false;
          return;
        }

        let workingBoard = currentBoard as Board;
        let currentRow = bestMove.fromRow;
        let currentCol = bestMove.fromCol;
        let targetRow = bestMove.toRow;
        let targetCol = bestMove.toCol;

        logger.debug(
          `Бот делает ход: (${currentRow},${currentCol}) -> (${targetRow},${targetCol})`
        );

        // Выполняем первый ход с анимацией
        workingBoard = await animateMove(
          workingBoard,
          currentRow,
          currentCol,
          targetRow,
          targetCol,
          bestMove.isCapture ?? false
        );

        // Обрабатываем серию взятий
        if (bestMove.isCapture) {
          let continueCapturing = true;

          while (continueCapturing) {
            const { moves: continuedCaptures, mustCapture } =
              getValidMovesWithCapturePriority(
                workingBoard,
                targetRow,
                targetCol
              );

            if (mustCapture && continuedCaptures.length > 0) {
              // Небольшая пауза между взятиями
              await new Promise((resolve) => setTimeout(resolve, 50));

              const nextCapture = continuedCaptures[0];

              currentRow = targetRow;
              currentCol = targetCol;
              targetRow = nextCapture.row;
              targetCol = nextCapture.col;

              logger.debug(
                `Бот продолжает серию: (${currentRow},${currentCol}) -> (${targetRow},${targetCol})`
              );

              workingBoard = await animateMove(
                workingBoard,
                currentRow,
                currentCol,
                targetRow,
                targetCol,
                true
              );
            } else {
              continueCapturing = false;
            }
          }
        }

        // Помечаем что бот сделал ход
        hasMovedRef.current = true;

        // Передаём ход игроку
        setPlayerTurn(true);
        setSelectedPiece(null);
        setValidMoves([]);
        setGameMessage("Ваш ход! Выберите фигуру для хода.");

        const gameStatus = checkGameStatus(workingBoard);
        if (gameStatus) {
          setGameOver(true);
          const message =
            gameStatus === "beagle"
              ? "Вы победили! Бигли одержали верх над корги!"
              : "Вы проиграли! Корги оказались хитрее!";
          setGameMessage(message);
        }
      } catch (error) {
        logger.error(
          "Ошибка при выполнении хода ботом:",
          (error as Error).message
        );
        setGameMessage("Произошла ошибка. Попробуйте перезапустить игру.");
      } finally {
        isProcessingRef.current = false;
      }
    };

    void makeAIMove();
  }, [
    playerTurn,
    gameOver,
    gameMode,
    isAnimating,
    animateMove,
    setPlayerTurn,
    setGameOver,
    setGameMessage,
    setSelectedPiece,
    setValidMoves,
  ]);
};
