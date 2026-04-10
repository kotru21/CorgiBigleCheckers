import {
  useState,
  useCallback,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { PieceAnimationInfo } from "@shared/types/pieceAnimation.types";
import type { Board, GameMode, Move, Player, Position } from "@shared/types/game.types";
import { PLAYER, PERFORMANCE_MODES } from "@shared/config/constants";
import { useGame } from "../store/gameStore";
import { useAnimationStore } from "../store/animationStore";
import {
  getValidMovesWithCapturePriority,
  executeMove,
  getPiecesWithCaptures,
} from "../services/MoveService";
import { checkGameStatus } from "../services/BoardService";
import { useBotAI } from "./useBotAI";
import { pieceUtils } from "../utils/gameHelpers";
import { logger } from "../utils/logger";
import type { CaptureInfo } from "../components/Board3D/types";
import { useTransientActionLock } from "./useTransientActionLock";

type PerformanceMode =
  (typeof PERFORMANCE_MODES)[keyof typeof PERFORMANCE_MODES];

export interface UseGameBoardControllerArgs {
  onReturnToMenu: () => void;
}

export interface UseGameBoardControllerResult {
  board: Board;
  gameMode: GameMode;
  playerTurn: boolean;
  gameOver: boolean;
  gameMessage: string;
  selectedPiece: Position | null;
  validMoves: Move[];
  piecesWithCaptures: CaptureInfo[];
  currentAnimation: PieceAnimationInfo | null;
  handlePerformanceData: (fps: number, mode: PerformanceMode) => void;
  handlePieceSelect: (row: number, col: number) => void;
  handleNewGame: () => void;
  handleReturnToMenu: () => void;
  performanceMode: PerformanceMode;
  currentFps: number;
  showFpsInfo: boolean;
  setShowFpsInfo: Dispatch<SetStateAction<boolean>>;
  perfDotClass: string;
  hudBtnClass: string;
}

export function useGameBoardController({
  onReturnToMenu,
}: UseGameBoardControllerArgs): UseGameBoardControllerResult {
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
    restartMatch,
  } = useGame();

  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>(
    PERFORMANCE_MODES.HIGH
  );
  const [showFpsInfo, setShowFpsInfo] = useState(false);
  const [currentFps, setCurrentFps] = useState(60);
  const [currentAnimation, setCurrentAnimation] =
    useState<PieceAnimationInfo | null>(null);

  const runNewGameLocked = useTransientActionLock(1000);

  const { startAnimation, isAnimating } = useAnimationStore();

  useBotAI({ setCurrentAnimation });

  const piecesWithCaptures = useMemo(() => {
    try {
      if (!playerTurn || !board) {
        return [] as CaptureInfo[];
      }
      return getPiecesWithCaptures(board, true, gameMode);
    } catch (error) {
      logger.error(
        "Ошибка при получении фигур с захватами:",
        (error as Error).message
      );
      return [] as CaptureInfo[];
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
    runNewGameLocked(() => {
      try {
        restartMatch();
        logger.info("Начата новая игра");
      } catch (error) {
        logger.error(
          "Ошибка при создании новой игры:",
          (error as Error).message
        );
        setGameMessage("Ошибка при создании новой игры.");
      }
    });
  }, [restartMatch, runNewGameLocked, setGameMessage]);

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

  return {
    board,
    gameMode,
    playerTurn,
    gameOver,
    gameMessage,
    selectedPiece,
    validMoves,
    piecesWithCaptures,
    currentAnimation,
    handlePerformanceData,
    handlePieceSelect,
    handleNewGame,
    handleReturnToMenu,
    performanceMode,
    currentFps,
    showFpsInfo,
    setShowFpsInfo,
    perfDotClass,
    hudBtnClass,
  };
}
