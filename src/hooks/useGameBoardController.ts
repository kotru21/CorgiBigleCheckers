import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { PieceAnimationInfo } from "@shared/types/pieceAnimation.types";
import type { Board, GameMode, Move, Player, Position } from "@shared/types/game.types";
import { PLAYER, PERFORMANCE_MODES } from "@shared/config/constants";
import { useGame } from "../store/gameStore";
import { restartMatchFromUI } from "../store/matchSessionActions";
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
import { useTransientActionLock } from "./useTransientActionLock";
import type { CaptureSquareRef } from "../game/squareVisualState";

/** Как `CaptureInfo` в Board3D: клетка + список захватов для подсветки. */
type PieceCaptureHighlight = CaptureSquareRef & { captures: Move[] };

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
  piecesWithCaptures: PieceCaptureHighlight[];
  currentAnimation: PieceAnimationInfo | null;
  handlePerformanceData: (fps: number, mode: PerformanceMode) => void;
  handlePieceSelect: (row: number, col: number) => void;
  handleNewGame: () => void;
  handleReturnToMenu: () => void;
  performanceMode: PerformanceMode;
  currentFps: number;
  showFpsInfo: boolean;
  setShowFpsInfo: Dispatch<SetStateAction<boolean>>;
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- сброс оверлея при смене доски (режим/рестарт из стора)
    setCurrentAnimation(null);
  }, [board]);

  const piecesWithCaptures = useMemo(() => {
    try {
      if (!playerTurn || !board) {
        return [] as PieceCaptureHighlight[];
      }
      return getPiecesWithCaptures(board, true, gameMode);
    } catch (error) {
      logger.error(
        "Ошибка при получении фигур с захватами:",
        (error as Error).message
      );
      return [] as PieceCaptureHighlight[];
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
        setCurrentAnimation(null);
        restartMatchFromUI();
        logger.info("Начата новая игра");
      } catch (error) {
        logger.error(
          "Ошибка при создании новой игры:",
          (error as Error).message
        );
        setGameMessage("Ошибка при создании новой игры.");
      }
    });
  }, [runNewGameLocked, setGameMessage, setCurrentAnimation]);

  const handleReturnToMenu = useCallback(() => {
    try {
      logger.info("Возврат в главное меню");
      onReturnToMenu();
    } catch (error) {
      logger.error("Ошибка при возврате в меню:", (error as Error).message);
    }
  }, [onReturnToMenu]);

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
  };
}
