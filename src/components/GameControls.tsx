import { createInitialBoard } from "../services/BoardService";
import { useGame } from "../store/gameStore";

export function GameControls() {
  const { setBoard, setGameOver, setPlayerTurn, setGameMessage } = useGame();

  const handleRestart = () => {
    const newBoard = createInitialBoard();
    setBoard(newBoard);
    setGameOver(false);
    setPlayerTurn(true);
    setGameMessage("Новая игра! Ваш ход!");
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-xl text-center">
      <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
        Игра завершена
      </h2>
      <button
        onClick={handleRestart}
        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 
                 text-white rounded-lg shadow-lg mt-4
                 transform transition-all duration-200 hover:scale-105">
        Начать новую игру
      </button>
    </div>
  );
}
