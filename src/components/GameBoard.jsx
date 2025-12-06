import React, { useState, useCallback, useMemo, useRef } from "react";
import { Board3D } from "./Board3D";
import { useGame } from "../contexts/GameContext.jsx";
import RulesModal from "./RulesModal";
import {
  getValidMovesWithCapturePriority,
  executeMove,
  getPiecesWithCaptures,
} from "../services/MoveService";
import { checkGameStatus, createInitialBoard } from "../services/BoardService";
import {
  PLAYER,
  PLAYER_KING,
  PERFORMANCE_MODES,
} from "@shared/config/constants";
import { useBotAI } from "../hooks/useBotAI";
import { pieceUtils } from "../utils/gameHelpers";
import { logger } from "../utils/logger";

export function GameBoard({ onReturnToMenu }) {
  const {
    board,
    setBoard,
    playerTurn,
    setPlayerTurn,
    selectedPiece,
    setSelectedPiece,
    validMoves,
    setValidMoves,
    gameOver,
    setGameOver,
    gameMessage,
    setGameMessage,
    gameMode,
  } = useGame();

  useBotAI();

  const [performanceMode, setPerformanceMode] = useState(
    PERFORMANCE_MODES.HIGH
  );
  const [showFpsInfo, setShowFpsInfo] = useState(false);
  const [currentFps, setCurrentFps] = useState(60);
  const [showRules, setShowRules] = useState(false);

  // Ref для предотвращения множественных вызовов
  const boardCreationRef = useRef(false);

  // Мемоизированное вычисление фигур с захватами с дебаунсом
  const piecesWithCaptures = useMemo(() => {
    try {
      if (!playerTurn || !board) return [];
      return getPiecesWithCaptures(board, true);
    } catch (error) {
      logger.error("Ошибка при получении фигур с захватами:", error.message);
      return [];
    }
  }, [board, playerTurn]);

  // Функция для получения данных о производительности от Board3D
  const handlePerformanceData = useCallback(
    (fps, mode) => {
      setCurrentFps(fps);

      if (mode !== performanceMode) {
        setPerformanceMode(mode);
      }
    },
    [performanceMode]
  );

  // Мемоизированная функция для обработки окончания игры
  const handleGameOver = useCallback(
    (winner) => {
      try {
        setGameOver(true);
        const message =
          winner === PLAYER
            ? "Вы победили! Бигли одержали верх над корги!"
            : "Вы проиграли! Корги оказались хитрее!";
        setGameMessage(message);
        logger.info(`Игра окончена. Победитель: ${winner}`);
      } catch (error) {
        logger.error("Ошибка при обработке окончания игры:", error.message);
      }
    },
    [setGameOver, setGameMessage]
  );

  // Функция для сброса выбора
  const resetSelection = useCallback(() => {
    setSelectedPiece(null);
    setValidMoves([]);
  }, [setSelectedPiece, setValidMoves]);

  // Функция для выбора фигуры
  const selectPiece = useCallback(
    (row, col) => {
      try {
        const { moves, mustCapture } = getValidMovesWithCapturePriority(
          board,
          row,
          col
        );
        setSelectedPiece({ row, col });
        setValidMoves(moves);

        let message = "Выберите поле для хода";
        if (mustCapture && moves.length === 0) {
          message = "У этой фигуры нет захватов. Выберите другую фигуру!";
        } else if (mustCapture && moves.length > 0) {
          message = "Захват обязателен! Выберите ход для захвата.";
        }

        setGameMessage(message);
      } catch (error) {
        logger.error("Ошибка при выборе фигуры:", error.message);
        setGameMessage("Ошибка при выборе фигуры. Попробуйте снова.");
      }
    },
    [board, setSelectedPiece, setValidMoves, setGameMessage]
  );

  // Оптимизированная функция выбора фигуры или хода
  const handlePieceSelect = useCallback(
    (row, col) => {
      if (gameOver || !playerTurn) return;

      try {
        const piece = board[row][col];
        const isPlayerPiece = pieceUtils.isPlayerPiece(piece);

        if (selectedPiece) {
          const isValidMove = validMoves.some(
            (move) => move.row === row && move.col === col
          );

          if (isValidMove) {
            const newBoard = executeMove(
              board,
              selectedPiece.row,
              selectedPiece.col,
              row,
              col
            );
            setBoard(newBoard);
            resetSelection();
            setPlayerTurn(false);
            setGameMessage("Ход корги...");

            const gameStatus = checkGameStatus(newBoard);
            if (gameStatus) {
              handleGameOver(gameStatus);
            }
          } else if (isPlayerPiece) {
            selectPiece(row, col);
          } else {
            resetSelection();
          }
        } else if (isPlayerPiece) {
          selectPiece(row, col);
        }
      } catch (error) {
        logger.error("Ошибка при обработке выбора фигуры:", error.message);
        setGameMessage("Произошла ошибка. Попробуйте еще раз.");
      }
    },
    [
      gameOver,
      playerTurn,
      board,
      selectedPiece,
      validMoves,
      setBoard,
      setPlayerTurn,
      setGameMessage,
      handleGameOver,
      resetSelection,
      selectPiece,
    ]
  );

  // Функция для начала новой игры с предотвращением множественных вызовов
  const handleNewGame = useCallback(() => {
    try {
      if (boardCreationRef.current) return;
      boardCreationRef.current = true;

      const newBoard = createInitialBoard();
      setBoard(newBoard);
      setGameOver(false);
      setPlayerTurn(true);
      setGameMessage("Новая игра! Ваш ход!");
      setSelectedPiece(null);
      setValidMoves([]);
      logger.info("Начата новая игра");

      // Сбрасываем флаг после небольшой задержки
      setTimeout(() => {
        boardCreationRef.current = false;
      }, 1000);
    } catch (error) {
      logger.error("Ошибка при создании новой игры:", error.message);
      setGameMessage("Ошибка при создании новой игры.");
      boardCreationRef.current = false;
    }
  }, [
    setBoard,
    setGameOver,
    setPlayerTurn,
    setGameMessage,
    setSelectedPiece,
    setValidMoves,
  ]);

  // Возврат в меню
  const handleReturnToMenu = useCallback(() => {
    try {
      logger.info("Возврат в главное меню");
      onReturnToMenu();
    } catch (error) {
      logger.error("Ошибка при возврате в меню:", error.message);
    }
  }, [onReturnToMenu]);

  return (
    <div
      id="chess-board-container"
      className="fixed inset-0 w-screen h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Статус игры */}
      <div className="absolute top-2 left-2 z-10 px-3 py-1 bg-black/40 backdrop-blur-sm rounded-md text-white font-medium">
        {gameMessage}
      </div>

      {/* Индикатор производительности */}
      <div
        className="absolute mr-12 top-2 right-36 z-10 px-3 py-1 bg-black/40 backdrop-blur-sm rounded-md text-white font-medium cursor-pointer"
        onClick={() => setShowFpsInfo(!showFpsInfo)}>
        <span
          className={`inline-block w-3 h-3 rounded-full mr-2 ${
            performanceMode === "high"
              ? "bg-green-500"
              : performanceMode === "medium"
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}></span>
        {showFpsInfo ? `${currentFps} FPS` : "Производительность"}
      </div>

      {/* Кнопка правил */}
      <button
        onClick={() => setShowRules(true)}
        className="absolute top-2 right-20 z-10 px-3 py-1 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-md text-white transition-colors">
        Правила
      </button>

      {/* Кнопка возврата в меню */}
      <button
        onClick={handleReturnToMenu}
        className="absolute top-2 right-2 z-10 px-3 py-1 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-md text-white transition-colors">
        Меню
      </button>

      {/* Игровая подсказка */}
      {playerTurn && !gameOver && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-md text-white text-sm">
          {selectedPiece ? "Выберите поле для хода" : "Выберите бигля для хода"}
        </div>
      )}

      {/* Доска на весь экран */}
      <div className="w-full h-full">
        <Board3D
          board={board}
          onPieceSelect={handlePieceSelect}
          selectedPiece={selectedPiece}
          validMoves={validMoves}
          onPerformanceData={handlePerformanceData}
          piecesWithCaptures={piecesWithCaptures}
          gameMode={gameMode}
        />
      </div>

      {/* Показ статуса окончания игры */}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-2xl text-center max-w-md mx-4">
            <h2 className="text-2xl font-bold mb-4 text-white">
              {gameMessage}
            </h2>
            <div className="flex gap-3">
              <button
                onClick={handleNewGame}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg shadow-lg hover:from-purple-600 hover:to-blue-600 transition-colors">
                Новая игра
              </button>
              <button
                onClick={handleReturnToMenu}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-700 text-white rounded-lg shadow-lg hover:from-gray-600 hover:to-gray-800 transition-colors">
                В меню
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно правил */}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}
