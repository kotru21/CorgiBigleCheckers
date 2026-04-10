import { useState } from "react";
import { Board3D } from "./Board3D";
import RulesModal from "./RulesModal";
import { ModeSelector } from "./ModeSelector";
import { GameBoardHud } from "./GameBoardHud";
import { GameOverSheet } from "./GameOverSheet";
import { useGameBoardController } from "../hooks/useGameBoardController";

interface GameBoardProps {
  onReturnToMenu: () => void;
}

export function GameBoard({ onReturnToMenu }: GameBoardProps) {
  const ctrl = useGameBoardController({ onReturnToMenu });
  const [showRules, setShowRules] = useState(false);
  const [modeSelectorOpen, setModeSelectorOpen] = useState(false);

  return (
    <div
      id="chess-board-container"
      className="fixed inset-0 min-h-dvh min-w-0 overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <Board3D
          board={ctrl.board}
          onPieceSelect={ctrl.handlePieceSelect}
          selectedPiece={ctrl.selectedPiece}
          validMoves={ctrl.validMoves}
          onPerformanceData={ctrl.handlePerformanceData}
          piecesWithCaptures={ctrl.piecesWithCaptures}
          gameMode={ctrl.gameMode}
          currentAnimation={ctrl.currentAnimation}
        />
      </div>

      <GameBoardHud
        gameMessage={ctrl.gameMessage}
        showFpsInfo={ctrl.showFpsInfo}
        onToggleFps={() => ctrl.setShowFpsInfo((prev) => !prev)}
        currentFps={ctrl.currentFps}
        performanceMode={ctrl.performanceMode}
        onOpenRules={() => setShowRules(true)}
        onOpenModeSelector={() => setModeSelectorOpen(true)}
        onReturnToMenu={ctrl.handleReturnToMenu}
        playerTurn={ctrl.playerTurn}
        gameOver={ctrl.gameOver}
        selectedPiece={ctrl.selectedPiece}
      />

      {ctrl.gameOver && (
        <GameOverSheet
          title={ctrl.gameMessage}
          onNewGame={ctrl.handleNewGame}
          onReturnToMenu={ctrl.handleReturnToMenu}
        />
      )}

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      {modeSelectorOpen && (
        <ModeSelector onClose={() => setModeSelectorOpen(false)} />
      )}
    </div>
  );
}
