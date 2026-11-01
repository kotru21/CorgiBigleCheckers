import { lazy, Suspense, useMemo, useState } from "react";
import { CORGI } from "@/shared/config/constants";
import { squareLabel, isKing, ownerOf } from "@/engine";
import { useGameBoardController } from "@/match/useGameBoardController";
import { beginMatchFromUI } from "@/match/matchSessionActions";
import { isWhite } from "@/match/matchLifecycle";
import { findPuzzle, nextPuzzle, puzzleSettings } from "@/match/puzzles";
import { moveSquares, type BoardOverlay } from "@/match/squareVisualState";
import { Board2D } from "./board2d/Board2D";
import { GameBoardHud } from "./GameBoardHud";
import { GameOverSheet } from "./GameOverSheet";
import { HistoryPanel } from "./HistoryPanel";
import { ModeSelector } from "./ModeSelector";
import RulesModal from "./RulesModal";
import { SceneErrorBoundary } from "./SceneErrorBoundary";
import { useBoardKeyboard } from "./hooks/useBoardKeyboard";
import { useMatchSounds } from "./hooks/useMatchSounds";
import { usePreferences } from "./preferencesStore";

const Board3D = lazy(() => import("@/scene/Board3D"));

const CONTAINER_ID = "chess-board-container";

const PIECE_NAMES = { beagle: "бигль", corgi: "корги" } as const;

interface GameBoardProps {
  onReturnToMenu: () => void;
}

function SceneLoading() {
  return (
    <div
      className="flex h-full items-center justify-center text-sm text-zinc-400"
      role="status">
      Загружаем 3D-доску…
    </div>
  );
}

export function GameBoard({ onReturnToMenu }: GameBoardProps) {
  const ctrl = useGameBoardController();
  const view = usePreferences((s) => s.view);
  const sound = usePreferences((s) => s.sound);
  const [showRules, setShowRules] = useState(false);
  const [modeSelectorOpen, setModeSelectorOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { settings, rules, result } = ctrl;

  useMatchSounds(sound);

  const flipped = settings.opponent === "bot" && settings.humanSide === CORGI;
  const keyboard = useBoardKeyboard({
    size: rules.boardSize,
    view,
    flipped,
    enabled: !showRules && !modeSelectorOpen && result === null,
    onSelect: ({ row, col }) => ctrl.handleSquareSelect(row, col),
    onCancel: ctrl.handleCancelSelection,
    onUndo: ctrl.handleUndo,
    onHint: ctrl.handleHint,
  });

  const overlay = useMemo<BoardOverlay>(
    () => ({
      selectedPiece: ctrl.selectedPiece,
      validMoves: ctrl.validMoves,
      piecesWithCaptures: ctrl.piecesWithCaptures,
      pendingCaptures: ctrl.pendingCaptures,
      lastMoveSquares: moveSquares(ctrl.lastMove),
      hintSquares: moveSquares(ctrl.hint),
      cursor: keyboard.cursor,
    }),
    [
      ctrl.selectedPiece,
      ctrl.validMoves,
      ctrl.piecesWithCaptures,
      ctrl.pendingCaptures,
      ctrl.lastMove,
      ctrl.hint,
      keyboard.cursor,
    ]
  );

  const boardProps = {
    board: ctrl.board,
    gameMode: settings.mode,
    overlay,
    controllableSide: ctrl.controllableSide,
    onSquareSelect: ctrl.handleSquareSelect,
  };
  const board2d = <Board2D {...boardProps} rules={rules} flipped={flipped} />;

  const cursorDescription = (() => {
    const cursor = keyboard.cursor;
    if (!cursor) {
      return "";
    }
    const piece = ctrl.board[cursor.row]?.[cursor.col] ?? null;
    const owner = ownerOf(piece);
    const content = owner
      ? `${isKing(piece) ? "дамка " : ""}${PIECE_NAMES[owner]}`
      : "пусто";
    return `Поле ${squareLabel(cursor, rules)}: ${content}`;
  })();

  const puzzle = findPuzzle(settings.puzzleId);
  const upcoming = puzzle ? nextPuzzle(puzzle.id) : null;
  const solved =
    puzzle !== null &&
    result?.kind === "win" &&
    result.winner === settings.humanSide;

  return (
    <div
      id={CONTAINER_ID}
      className="fixed inset-0 min-h-dvh min-w-0 overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        {view === "3d" ? (
          <SceneErrorBoundary fallback={board2d}>
            <Suspense fallback={<SceneLoading />}>
              <Board3D {...boardProps} />
            </Suspense>
          </SceneErrorBoundary>
        ) : (
          board2d
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {cursorDescription}
      </p>

      <GameBoardHud
        containerId={CONTAINER_ID}
        gameMessage={ctrl.gameMessage}
        gameOver={result !== null}
        canUndo={ctrl.canUndo}
        canHint={ctrl.canHint}
        hintPending={ctrl.hintPending}
        canResign={!puzzle && result === null}
        historyOpen={historyOpen}
        onUndo={ctrl.handleUndo}
        onHint={ctrl.handleHint}
        onToggleHistory={() => setHistoryOpen((open) => !open)}
        onResign={ctrl.handleResign}
        onOpenRules={() => setShowRules(true)}
        onOpenModeSelector={() => setModeSelectorOpen(true)}
        onReturnToMenu={onReturnToMenu}
      />

      {historyOpen && (
        <HistoryPanel
          notations={ctrl.notations}
          record={ctrl.record}
          startsWithWhite={isWhite(ctrl.startTurn)}
          onClose={() => setHistoryOpen(false)}
        />
      )}

      {result !== null && (
        <GameOverSheet
          title={ctrl.gameMessage}
          primaryLabel={
            solved
              ? upcoming
                ? "Следующая задача"
                : "Все задачи решены!"
              : puzzle
                ? "Заново"
                : "Новая игра"
          }
          onPrimary={
            solved && upcoming
              ? () => beginMatchFromUI(puzzleSettings(upcoming))
              : solved
                ? onReturnToMenu
                : ctrl.handleNewGame
          }
          onReturnToMenu={onReturnToMenu}
          onUndo={!solved && ctrl.canUndo ? ctrl.handleUndo : undefined}
        />
      )}

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      {modeSelectorOpen && (
        <ModeSelector onClose={() => setModeSelectorOpen(false)} />
      )}
    </div>
  );
}

export default GameBoard;
