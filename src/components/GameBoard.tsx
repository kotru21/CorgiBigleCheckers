import { useState, useCallback, useMemo, useRef } from "react";
import { Board3D } from "./Board3D";
import { useGame } from "../store/gameStore";
import RulesModal from "./RulesModal";
import {
  getValidMovesWithCapturePriority,
  executeMove,
  getPiecesWithCaptures,
} from "../services/MoveService";
import { checkGameStatus, createInitialBoard } from "../services/BoardService";
import { PLAYER, PERFORMANCE_MODES } from "@shared/config/constants";
import { useBotAI } from "../hooks/useBotAI";
import { pieceUtils } from "../utils/gameHelpers";
import { logger } from "../utils/logger";
import type { Move, Player, GameMode } from "@shared/types/game.types";

type PerformanceMode =
  (typeof PERFORMANCE_MODES)[keyof typeof PERFORMANCE_MODES];

interface GameBoardProps {
  onReturnToMenu: () => void;
}

export function GameBoard({ onReturnToMenu }: GameBoardProps) {
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

  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>(
    PERFORMANCE_MODES.HIGH
  );
  const [showFpsInfo, setShowFpsInfo] = useState(false);
  const [currentFps, setCurrentFps] = useState(60);
  const [showRules, setShowRules] = useState(false);

  const boardCreationRef = useRef(false);

  const piecesWithCaptures = useMemo(() => {
    try {
      if (!playerTurn || !board) {
        return [] as Array<{
          row: number;
          col: number;
          captures: Move[];
        }>;
      }
      return getPiecesWithCaptures(board, true);
    } catch (error) {
      logger.error(
        "Ошибка при получении фигур с захватами:",
        (error as Error).message
      );
      return [] as Array<{ row: number; col: number; captures: Move[] }>;
    }
  }, [board, playerTurn]);

  const handlePerformanceData = useCallback(
    (fps: number, mode: PerformanceMode) => {
      setCurrentFps(fps);

      if (mode !== performanceMode) {
        setPerformanceMode(mode);
      }
    },
    [performanceMode]
  );

  const handleGameOver = useCallback(
    (winner: Player) => {
      try {
        setGameOver(true);
        const message =
          winner === PLAYER
            ? "Вы победили! Бигли одержали верх над корги!"
            : "Вы проиграли! Корги оказались хитрее!";
        setGameMessage(message);
        logger.info(`Игра окончена. Победитель: ${winner}`);
      } catch (error) {
        logger.error(
          "Ошибка при обработке окончания игры:",
          (error as Error).message
        );
      }
    },
    [setGameOver, setGameMessage]
  );

  const resetSelection = useCallback(() => {
    setSelectedPiece(null);
    setValidMoves([]);
  }, [setSelectedPiece, setValidMoves]);

  const selectPiece = useCallback(
    (row: number, col: number) => {
      try {
        const { moves, mustCapture } = getValidMovesWithCapturePriority(
          board,
          row,
          col
        );
        setSelectedPiece({ row, col });
        setValidMoves([...moves]);

        let message = "Выберите поле для хода";
        if (mustCapture && moves.length === 0) {
          message = "У этой фигуры нет захватов. Выберите другую фигуру!";
        } else if (mustCapture && moves.length > 0) {
          message = "Захват обязателен! Выберите ход для захвата.";
        }

        setGameMessage(message);
      } catch (error) {
        logger.error("Ошибка при выборе фигуры:", (error as Error).message);
        setGameMessage("Ошибка при выборе фигуры. Попробуйте снова.");
      }
    },
    [board, setSelectedPiece, setValidMoves, setGameMessage]
  );

  const handlePieceSelect = useCallback(
    (row: number, col: number) => {
      if (gameOver || !playerTurn) {
        return;
      }

      try {
        const piece = board[row][col];
        const isPlayerPiece = pieceUtils.isPlayerPiece(piece);

        if (selectedPiece) {
          const selectedMove = validMoves.find(
            (move) => move.row === row && move.col === col
          );

          if (selectedMove) {
            const newBoard = executeMove(
              board,
              selectedPiece.row,
              selectedPiece.col,
              row,
              col
            );
            setBoard(newBoard);

            const wasCapture = selectedMove.capturedRow !== undefined;

            if (wasCapture) {
              const { moves: continuedCaptures, mustCapture } =
                getValidMovesWithCapturePriority(newBoard, row, col);

              if (mustCapture && continuedCaptures.length > 0) {
                setSelectedPiece({ row, col });
                setValidMoves([...continuedCaptures]);
                setGameMessage(
                  "Продолжайте взятие! Серия должна быть завершена."
                );
                return;
              }
            }

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
        logger.error(
          "Ошибка при обработке выбора фигуры:",
          (error as Error).message
        );
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
      setSelectedPiece,
      setValidMoves,
    ]
  );

  const handleNewGame = useCallback(() => {
    try {
      if (boardCreationRef.current) {
        return;
      }
      boardCreationRef.current = true;

      const newBoard = createInitialBoard();
      setBoard(newBoard);
      setGameOver(false);
      setPlayerTurn(true);
      setGameMessage("Новая игра! Ваш ход!");
      setSelectedPiece(null);
      setValidMoves([]);
      logger.info("Начата новая игра");

      setTimeout(() => {
        boardCreationRef.current = false;
      }, 1000);
    } catch (error) {
      logger.error("Ошибка при создании новой игры:", (error as Error).message);
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

  const handleReturnToMenu = useCallback(() => {
    try {
      logger.info("Возврат в главное меню");
      onReturnToMenu();
    } catch (error) {
      logger.error("Ошибка при возврате в меню:", (error as Error).message);
    }
  }, [onReturnToMenu]);

  return (
    <div
      id="chess-board-container"
      className="fixed inset-0 w-screen h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="absolute top-2 left-2 z-10 px-3 py-1 bg-black/40 backdrop-blur-sm rounded-md text-white font-medium">
        {gameMessage}
      </div>

      <div
        className="absolute mr-12 top-2 right-36 z-10 px-3 py-1 bg-black/40 backdrop-blur-sm rounded-md text-white font-medium cursor-pointer"
        onClick={() => setShowFpsInfo((prev) => !prev)}>
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

      <button
        onClick={() => setShowRules(true)}
        className="absolute top-2 right-20 z-10 px-3 py-1 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-md text-white transition-colors">
        Правила
      </button>

      <button
        onClick={handleReturnToMenu}
        className="absolute top-2 right-2 z-10 px-3 py-1 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-md text-white transition-colors">
        Меню
      </button>

      {playerTurn && !gameOver && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-md text-white text-sm">
          {selectedPiece ? "Выберите поле для хода" : "Выберите бигля для хода"}
        </div>
      )}

      <div className="w-full h-full">
        <Board3D
          board={board}
          onPieceSelect={handlePieceSelect}
          selectedPiece={selectedPiece}
          validMoves={validMoves}
          onPerformanceData={handlePerformanceData}
          piecesWithCaptures={piecesWithCaptures}
          gameMode={gameMode as GameMode}
        />
      </div>

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

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}
