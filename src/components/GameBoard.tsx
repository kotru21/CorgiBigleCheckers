import { useState, useCallback, useMemo, useRef } from "react";
import { Board3D, type PieceAnimationInfo } from "./Board3D";
import { useGame } from "../store/gameStore";
import { useAnimationStore } from "../store/animationStore";
import RulesModal from "./RulesModal";
import { ModeSelector } from "./ModeSelector";
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
import { getModeStartMessage } from "../utils/modeHelpers";
import type { Move, Player } from "@shared/types/game.types";

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

  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>(
    PERFORMANCE_MODES.HIGH
  );
  const [showFpsInfo, setShowFpsInfo] = useState(false);
  const [currentFps, setCurrentFps] = useState(60);
  const [showRules, setShowRules] = useState(false);
  const [modeSelectorOpen, setModeSelectorOpen] = useState(false);
  const [currentAnimation, setCurrentAnimation] =
    useState<PieceAnimationInfo | null>(null);

  const boardCreationRef = useRef(false);

  const { startAnimation, isAnimating } = useAnimationStore();

  useBotAI({ setCurrentAnimation });

  const piecesWithCaptures = useMemo(() => {
    try {
      if (!playerTurn || !board) {
        return [] as Array<{
          row: number;
          col: number;
          captures: Move[];
        }>;
      }
      return getPiecesWithCaptures(board, true, gameMode);
    } catch (error) {
      logger.error(
        "Ошибка при получении фигур с захватами:",
        (error as Error).message
      );
      return [] as Array<{ row: number; col: number; captures: Move[] }>;
    }
  }, [board, playerTurn, gameMode]);

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
          col,
          gameMode
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
    [board, gameMode, setSelectedPiece, setValidMoves, setGameMessage]
  );

  const handlePieceSelect = useCallback(
    (row: number, col: number) => {
      if (gameOver || !playerTurn || isAnimating) {
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
            const wasCapture = selectedMove.capturedRow !== undefined;
            const fromRow = selectedPiece.row;
            const fromCol = selectedPiece.col;

            const animationId = startAnimation(
              fromRow,
              fromCol,
              row,
              col,
              wasCapture,
              () => {
                const newBoard = executeMove(board, fromRow, fromCol, row, col);
                setBoard(newBoard);
                setCurrentAnimation(null);

                if (wasCapture) {
                  const { moves: continuedCaptures, mustCapture } =
                    getValidMovesWithCapturePriority(
                      newBoard,
                      row,
                      col,
                      gameMode
                    );

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

                const gameStatus = checkGameStatus(newBoard, gameMode);
                if (gameStatus) {
                  handleGameOver(gameStatus);
                }
              }
            );

            setCurrentAnimation({
              fromRow,
              fromCol,
              toRow: row,
              toCol: col,
              animationId,
            });
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
      isAnimating,
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
      startAnimation,
      gameMode,
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
      setGameMessage(getModeStartMessage(gameMode));
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
    gameMode,
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

  const perfDotClass =
    performanceMode === "high"
      ? "bg-zinc-400"
      : performanceMode === "medium"
        ? "bg-amber-400"
        : "bg-red-500";

  const hudBtnClass =
    "inline-flex h-8 min-h-8 shrink-0 items-center justify-center gap-1 rounded-full bg-black/45 px-2.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-zinc-100 shadow-sm backdrop-blur-md transition-[background-color,color] duration-200 cursor-pointer hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/80 sm:px-3";

  return (
    <div
      id="chess-board-container"
      className="fixed inset-0 min-h-dvh min-w-0 overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <Board3D
          board={board}
          onPieceSelect={handlePieceSelect}
          selectedPiece={selectedPiece}
          validMoves={validMoves}
          onPerformanceData={handlePerformanceData}
          piecesWithCaptures={piecesWithCaptures}
          gameMode={gameMode}
          currentAnimation={currentAnimation}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col">
        <div className="safe-pt safe-px flex w-full shrink-0 items-center gap-1.5 pt-1.5 sm:gap-2 sm:pt-2">
          <p
            className="pointer-events-none flex h-8 min-h-8 min-w-0 max-w-[min(100%,15.5rem)] items-center rounded-full bg-black/40 px-2.5 text-left text-[10px] leading-none text-zinc-100 shadow-sm backdrop-blur-md sm:max-w-[18rem] sm:px-3 sm:text-[11px]"
            role="status"
            aria-live="polite"
            title={gameMessage}>
            <span className="min-w-0 truncate">{gameMessage}</span>
          </p>
          <div className="pointer-events-auto ml-auto flex h-8 min-h-8 shrink-0 items-center justify-center gap-1.5">
            <button
              type="button"
              className={`${hudBtnClass} ${showFpsInfo ? "text-cyan-200" : ""}`}
              onClick={() => setShowFpsInfo((prev) => !prev)}
              aria-pressed={showFpsInfo}
              title="Производительность / FPS">
              <span
                className={`inline-block size-1.5 shrink-0 rounded-full ${perfDotClass}`}
                aria-hidden
              />
              <span className="tabular-nums">
                {showFpsInfo ? `${currentFps}` : "FPS"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setShowRules(true)}
              className={hudBtnClass}
              title="Правила">
              ?
            </button>
            <button
              type="button"
              onClick={() => setModeSelectorOpen(true)}
              className={hudBtnClass}
              title="Сменить режим">
              Режим
            </button>
            <button
              type="button"
              onClick={handleReturnToMenu}
              className={`${hudBtnClass} text-cyan-200`}
              title="В главное меню">
              Меню
            </button>
          </div>
        </div>

        {playerTurn && !gameOver && (
          <div className="safe-pb safe-px pointer-events-none mt-auto flex justify-center pb-2 sm:pb-3">
            <p className="rounded-full bg-black/40 px-3 py-1 text-center text-[10px] text-zinc-200/95 shadow-sm backdrop-blur-md sm:text-[11px]">
              {selectedPiece
                ? "Коснитесь клетки для хода"
                : "Коснитесь бигля, чтобы походить"}
            </p>
          </div>
        )}
      </div>

      {gameOver && (
        <div
          className="safe-pt safe-pb safe-px fixed inset-0 z-30 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="game-over-title">
          <div className="w-full max-w-sm animate-[appear_0.35s_ease-out] rounded-t-2xl border border-zinc-700/90 bg-(--color-surface) p-4 shadow-2xl backdrop-blur-xl sm:max-w-md sm:rounded-2xl sm:p-6">
            <div className="mb-4 h-0.5 w-12 rounded-full bg-cyan-400/80 sm:mx-auto" />
            <h2
              id="game-over-title"
              className="font-display mb-4 text-center text-lg font-bold leading-snug text-zinc-100 sm:text-xl">
              {gameMessage}
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <button
                type="button"
                onClick={handleNewGame}
                className="min-h-11 flex-1 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-zinc-950 shadow-lg transition-[filter] duration-200 cursor-pointer hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
                Новая игра
              </button>
              <button
                type="button"
                onClick={handleReturnToMenu}
                className="min-h-11 flex-1 rounded-xl border border-zinc-600 bg-zinc-800/80 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-colors duration-200 cursor-pointer hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500">
                В меню
              </button>
            </div>
          </div>
        </div>
      )}

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      {modeSelectorOpen && (
        <ModeSelector onClose={() => setModeSelectorOpen(false)} />
      )}
    </div>
  );
}
