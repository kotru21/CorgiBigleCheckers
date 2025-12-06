import { useGame } from "../contexts/GameContext";
import { GAME_MODES } from "@shared/config/constants";
import { createInitialBoard } from "../services/BoardService";
import { getModeName } from "../utils/modeHelpers";
import type { GameMode } from "@shared/types/game.types";

interface ModeSelectorProps {
  onClose: () => void;
}

export function ModeSelector({ onClose }: ModeSelectorProps) {
  const { setGameMode, setBoard, setPlayerTurn, setGameOver, setGameMessage } =
    useGame();

  const handleSelectMode = (mode: GameMode) => {
    setGameMode(mode);
    const newBoard = createInitialBoard();
    setBoard(newBoard);
    setPlayerTurn(true);
    setGameOver(false);
    setGameMessage(`Режим ${getModeName(mode)}! Ваш ход!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full">
        <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          Выберите режим игры
        </h2>

        <div className="grid gap-4">
          <button
            onClick={() => handleSelectMode(GAME_MODES.CLASSIC)}
            className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg transition-transform hover:scale-105">
            <span className="block text-xl font-bold">Классический</span>
            <span className="text-sm opacity-80">
              Стандартные правила шашек
            </span>
          </button>

          <button
            onClick={() => handleSelectMode(GAME_MODES.CRAZY_JUMPS)}
            className="p-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg shadow-lg transition-transform hover:scale-105">
            <span className="block text-xl font-bold">Безумные прыжки</span>
            <span className="text-sm opacity-80">
              Возможны прыжки через всю доску
            </span>
          </button>

          <button
            onClick={() => handleSelectMode(GAME_MODES.PARTY_MODE)}
            className="p-4 bg-gradient-to-r from-pink-500 to-orange-600 text-white rounded-lg shadow-lg transition-transform hover:scale-105">
            <span className="block text-xl font-bold">Режим вечеринки</span>
            <span className="text-sm opacity-80">
              Случайные эффекты и повороты фигур
            </span>
          </button>

          <button
            onClick={() => handleSelectMode(GAME_MODES.TURBO)}
            className="p-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg shadow-lg transition-transform hover:scale-105">
            <span className="block text-xl font-bold">Турбо режим</span>
            <span className="text-sm opacity-80">
              Ускоренный темп игры с быстрым ботом
            </span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-6 px-6 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg w-full hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors">
          Отмена
        </button>
      </div>
    </div>
  );
}
