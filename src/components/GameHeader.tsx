interface GameHeaderProps {
  onModeSelect: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  gameMessage: string;
}

export function GameHeader({
  onModeSelect,
  onToggleFullscreen,
  isFullscreen,
  gameMessage,
}: GameHeaderProps) {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-xl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600">
          Корги против Биглей
        </h1>
        <div className="flex gap-4">
          <button
            onClick={onModeSelect}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 
                     text-white rounded-lg shadow-lg
                     transform transition-all duration-200 hover:scale-105">
            Сменить режим
          </button>
          <button
            onClick={onToggleFullscreen}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 
                     text-white rounded-lg shadow-lg
                     transform transition-all duration-200 hover:scale-105">
            {isFullscreen ? "Свернуть" : "На весь экран"}
          </button>
        </div>
      </div>

      <div className="mt-6 text-center min-h-16">
        <p
          className="text-xl font-semibold animate-[messageSlide_0.5s_ease-out] 
                   bg-gradient-to-r from-blue-600 to-purple-600 
                   text-transparent bg-clip-text">
          {gameMessage}
        </p>
      </div>
    </div>
  );
}
