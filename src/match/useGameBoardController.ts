import { useCallback, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import type {
  Board,
  MatchResult,
  PieceMove,
  Player,
  Position,
} from "@/shared/types/game.types";
import { logger } from "@/shared/logger";
import { getBotClient } from "@/ai/botClient";
import {
  formatGameRecord,
  getLegalMoves,
  moveNotation,
  ownerOf,
  relocatePiece,
  samePosition,
  type RuleOptions,
} from "@/engine";
import { useAnimationStore } from "./animationStore";
import { useGameStore } from "./gameStore";
import { canUndo, isWhite, turnMessage } from "./matchLifecycle";
import {
  resignFromUI,
  restartMatchFromUI,
  undoFromUI,
} from "./matchSessionActions";
import {
  advanceSelection,
  isCaptureSelection,
  selectionCaptured,
  selectionSquare,
  selectionTargets,
  startSelection,
  type MoveSelection,
} from "./moveSelection";
import { isHumanControlled, type MatchSettings } from "./settings";
import { useBotAI } from "./useBotAI";

export interface GameBoardController {
  board: Board;
  rules: RuleOptions;
  settings: MatchSettings;
  turn: Player;
  startTurn: Player;
  controllableSide: Player | null;
  result: MatchResult | null;
  gameMessage: string;
  selectedPiece: Position | null;
  validMoves: Position[];
  piecesWithCaptures: Position[];
  pendingCaptures: Position[];
  lastMove: PieceMove | null;
  hint: PieceMove | null;
  notations: string[];
  record: string;
  canUndo: boolean;
  canHint: boolean;
  hintPending: boolean;
  handleSquareSelect: (row: number, col: number) => void;
  handleCancelSelection: () => void;
  handleUndo: () => void;
  handleHint: () => void;
  handleNewGame: () => void;
  handleResign: () => void;
}

const uniquePositions = (positions: Position[]) =>
  positions.filter(
    (p, i) => positions.findIndex((q) => samePosition(p, q)) === i
  );

export function useGameBoardController(): GameBoardController {
  const state = useGameStore(
    useShallow((s) => ({
      board: s.board,
      displayBoard: s.displayBoard,
      settings: s.settings,
      rules: s.rules,
      start: s.start,
      turn: s.turn,
      result: s.result,
      gameMessage: s.gameMessage,
      selection: s.selection,
      history: s.history,
      hint: s.hint,
      revision: s.revision,
    }))
  );
  const { board, settings, rules, turn, result, selection, history } = state;
  const [hintRevision, setHintRevision] = useState<number | null>(null);

  useBotAI();

  useEffect(
    () => () => {
      useAnimationStore.getState().clearAllAnimations();
    },
    []
  );

  const humanTurn = result === null && isHumanControlled(settings, turn);

  const legalMoves = useMemo(
    () => (humanTurn ? getLegalMoves(board, turn, rules) : []),
    [board, turn, rules, humanTurn]
  );
  const mustCapture =
    legalMoves.length > 0 && legalMoves[0].captures.length > 0;

  const piecesWithCaptures = useMemo(
    () =>
      mustCapture && (!selection || selection.step === 0)
        ? uniquePositions(legalMoves.map((m) => m.from))
        : [],
    [legalMoves, mustCapture, selection]
  );
  const validMoves = useMemo(
    () => (selection ? selectionTargets(selection) : []),
    [selection]
  );
  const pendingCaptures = useMemo(
    () => (selection ? selectionCaptured(selection) : []),
    [selection]
  );
  const notations = useMemo(
    () => history.map((entry) => entry.notation),
    [history]
  );
  const record = useMemo(
    () => formatGameRecord(notations, isWhite(state.start.turn)),
    [notations, state.start.turn]
  );

  const failMove = useCallback((error: unknown) => {
    logger.error("Ошибка при ходе игрока:", error);
    const store = useGameStore.getState();
    store.setSelection(null);
    store.setDisplayBoard(null);
    store.setGameMessage("Не удалось сделать ход. Попробуйте ещё раз.");
  }, []);

  const stepTo = useCallback(
    async (current: MoveSelection, target: Position) => {
      const advanced = advanceSelection(current, target);
      if (!advanced) {
        return;
      }
      const store = useGameStore.getState;
      const { revision } = store();
      const from = selectionSquare(current);
      store().setHint(null);

      const completed = await useAnimationStore
        .getState()
        .animateMove(
          from.row,
          from.col,
          target.row,
          target.col,
          isCaptureSelection(current)
        );
      if (!completed || store().revision !== revision) {
        return;
      }

      if (advanced.completed) {
        store().commitMove(advanced.completed);
        return;
      }
      const latest = store();
      latest.setDisplayBoard(
        relocatePiece(latest.displayBoard ?? latest.board, from, target)
      );
      latest.setSelection(advanced.selection);
      latest.setGameMessage("Продолжайте взятие — серию нужно завершить");
    },
    []
  );

  const handleSquareSelect = useCallback(
    (row: number, col: number) => {
      const store = useGameStore.getState();
      if (
        store.result ||
        !isHumanControlled(store.settings, store.turn) ||
        useAnimationStore.getState().isAnimating
      ) {
        return;
      }

      const target = { row, col };
      const current = store.selection;

      if (current && advanceSelection(current, target)) {
        stepTo(current, target).catch(failMove);
        return;
      }

      if (current && current.step > 0) {
        store.setGameMessage("Серия не закончена: ходите на подсвеченное поле");
        return;
      }

      if (ownerOf(store.board[row][col]) === store.turn) {
        const next = startSelection(legalMoves, target);
        store.setSelection(next);
        if (next) {
          store.setGameMessage(
            isCaptureSelection(next)
              ? "Взятие обязательно! Выберите поле"
              : "Выберите поле для хода"
          );
        } else {
          store.setGameMessage(
            mustCapture
              ? "Взятие обязательно — выберите подсвеченную шашку"
              : "Этой шашкой некуда ходить"
          );
        }
        return;
      }

      store.setSelection(null);
    },
    [legalMoves, mustCapture, stepTo, failMove]
  );

  const handleCancelSelection = useCallback(() => {
    const store = useGameStore.getState();
    if (useAnimationStore.getState().isAnimating || !store.selection) {
      return;
    }
    store.setSelection(null);
    store.setDisplayBoard(null);
    store.setGameMessage(turnMessage(store.settings, store.turn));
  }, []);

  const handleUndo = useCallback(() => {
    if (useAnimationStore.getState().isAnimating) {
      return;
    }
    const store = useGameStore.getState();
    if (store.selection && store.selection.step > 0) {
      handleCancelSelection();
      return;
    }
    undoFromUI();
  }, [handleCancelSelection]);

  const handleHint = useCallback(() => {
    const store = useGameStore.getState();
    if (store.result || !isHumanControlled(store.settings, store.turn)) {
      return;
    }
    const { revision, board: hintBoard, turn: side, rules: hintRules } = store;
    setHintRevision(revision);
    store.setGameMessage("Ищу лучший ход…");
    getBotClient()
      .requestMove({
        board: hintBoard,
        side,
        rules: hintRules,
        level: "hint",
        history: {
          positionCounts: store.draw.positionCounts,
          kingMovePlies: store.draw.kingMovePlies,
        },
      })
      .then((move) => {
        const latest = useGameStore.getState();
        if (latest.revision !== revision) {
          return;
        }
        latest.setHint(move);
        latest.setGameMessage(
          move
            ? `Подсказка: ${moveNotation(move, getLegalMoves(hintBoard, side, hintRules), hintRules)}`
            : "Подсказки нет"
        );
      })
      .catch((error: unknown) => {
        logger.warn("Не удалось получить подсказку:", error);
      })
      .finally(() => setHintRevision(null));
  }, []);

  const handleNewGame = useCallback(() => {
    restartMatchFromUI();
  }, []);

  return {
    board: state.displayBoard ?? board,
    rules,
    settings,
    turn,
    startTurn: state.start.turn,
    controllableSide: humanTurn ? turn : null,
    result,
    gameMessage: state.gameMessage,
    selectedPiece: selection ? selectionSquare(selection) : null,
    validMoves,
    piecesWithCaptures,
    pendingCaptures,
    lastMove: history.at(-1)?.move ?? null,
    hint: state.hint,
    notations,
    record,
    canUndo: canUndo(history, settings) || (selection?.step ?? 0) > 0,
    canHint: humanTurn && state.hint === null && hintRevision === null,
    hintPending: hintRevision !== null,
    handleSquareSelect,
    handleCancelSelection,
    handleUndo,
    handleHint,
    handleNewGame,
    handleResign: resignFromUI,
  };
}
