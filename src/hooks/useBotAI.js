import { useEffect } from "react";
import { useGame } from "../contexts/GameContext";
import { getBestMove } from "../services/AIservice";
import { executeMove } from "../services/MoveService";
import { checkGameStatus } from "../services/BoardService";
import { GAME_CONFIG, GAME_MODES } from "../models/Constants";
import { logger } from "../utils/logger.js";

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
    if (!playerTurn && !gameOver) {
      const makeAIMove = async () => {
        try {
          // Определяем глубину поиска в зависимости от режима игры
          const depth =
            gameMode === GAME_MODES.TURBO
              ? GAME_CONFIG.AI_DEPTH.TURBO
              : GAME_CONFIG.AI_DEPTH.MEDIUM;

          // Задержка для режима турбо
          const delay =
            gameMode === GAME_MODES.TURBO
              ? GAME_CONFIG.AI_DELAY.TURBO
              : GAME_CONFIG.AI_DELAY.NORMAL;

          await new Promise((resolve) => setTimeout(resolve, delay));

          const bestMove = getBestMove(board, depth);

          if (bestMove) {
            const newBoard = executeMove(
              board,
              bestMove.fromRow,
              bestMove.fromCol,
              bestMove.toRow,
              bestMove.toCol
            );

            setBoard(newBoard);
            setPlayerTurn(true);
            setSelectedPiece(null);
            setValidMoves([]);
            setGameMessage("Ваш ход! Выберите фигуру для хода.");

            // Проверяем состояние игры
            const gameStatus = checkGameStatus(newBoard);
            if (gameStatus) {
              setGameOver(true);
              const message =
                gameStatus === "beagle"
                  ? "Вы победили! Бигли одержали верх над корги!"
                  : "Вы проиграли! Корги оказались хитрее!";
              setGameMessage(message);
            }

            logger.debug(
              `Бот сделал ход: (${bestMove.fromRow},${bestMove.fromCol}) -> (${bestMove.toRow},${bestMove.toCol})`
            );
          } else {
            logger.warn("Бот не смог найти допустимый ход");
            setGameOver(true);
            setGameMessage("Вы победили! У корги нет доступных ходов!");
          }
        } catch (error) {
          logger.error("Ошибка при выполнении хода ботом:", error.message);
          setGameMessage("Произошла ошибка. Попробуйте перезапустить игру.");
        }
      };

      makeAIMove();
    }
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
