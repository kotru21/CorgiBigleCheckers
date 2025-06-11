import { useEffect, useCallback, useRef } from "react";
import { useGame } from "../contexts/GameContext.jsx";
import { getBestMove } from "../services/AIservice";
import { executeMove } from "../services/MoveService";
import { checkGameStatus } from "../services/BoardService";
import { PLAYER, BOT, GAME_MODES, GAME_CONFIG } from "../models/Constants";

export function useBotAI() {
  const {
    board,
    setBoard,
    playerTurn,
    setPlayerTurn,
    gameOver,
    setGameOver,
    setGameMessage,
    gameMode,
  } = useGame();

  const timeoutRef = useRef(null);

  const handleGameOver = useCallback(
    (winner) => {
      setGameOver(true);
      const message =
        winner === PLAYER
          ? "Вы победили! Бигли одержали верх над корги!"
          : "Вы проиграли! Корги оказались хитрее!";
      setGameMessage(message);
    },
    [setGameOver, setGameMessage]
  );

  // Очистка таймаута при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Логика хода бота
  const makeBotMove = useCallback(() => {
    if (gameOver || playerTurn) return;

    // Очищаем предыдущий таймаут
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const delay =
      GAME_CONFIG.AI_DELAY[gameMode === GAME_MODES.TURBO ? "TURBO" : "NORMAL"];
    const depth =
      GAME_CONFIG.AI_DEPTH[gameMode === GAME_MODES.TURBO ? "TURBO" : "MEDIUM"];

    timeoutRef.current = setTimeout(() => {
      try {
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
          setGameMessage("Ваш ход!");

          // Проверяем состояние игры после хода бота
          const gameStatus = checkGameStatus(newBoard);
          if (gameStatus) {
            handleGameOver(gameStatus);
          }
        } else {
          handleGameOver(PLAYER);
        }
      } catch (error) {
        console.error("Ошибка при выполнении хода бота:", error);
        handleGameOver(PLAYER);
      }
    }, delay);
  }, [
    board,
    gameOver,
    playerTurn,
    gameMode,
    setBoard,
    setPlayerTurn,
    setGameMessage,
    handleGameOver,
  ]);

  // Запускаем ход бота каждый раз, когда ход переходит к нему
  useEffect(() => {
    if (!playerTurn && !gameOver) {
      makeBotMove();
    }
  }, [playerTurn, gameOver, makeBotMove]);

  return { makeBotMove };
}
