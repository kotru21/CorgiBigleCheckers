import React, { useState } from "react";
import { useGame } from "../contexts/GameContext";
import { GAME_MODES } from "../models/Constants";
import { createInitialBoard } from "../services/BoardService";
import RulesModal from "./RulesModal";

export function MainMenu({ onStartGame }) {
  const { setGameMode, setBoard, setPlayerTurn, setGameOver, setGameMessage } =
    useGame();
  const [showRules, setShowRules] = useState(false);

  const handleSelectMode = (mode) => {
    setGameMode(mode);
    const newBoard = createInitialBoard();
    setBoard(newBoard);
    setPlayerTurn(true);
    setGameOver(false);
    setGameMessage(`Режим ${getModeName(mode)}! Ваш ход!`);
    onStartGame();
  };

  const getModeName = (mode) => {
    switch (mode) {
      case GAME_MODES.CLASSIC:
        return "Классический";
      case GAME_MODES.CRAZY_JUMPS:
        return "Безумные прыжки";
      case GAME_MODES.PARTY_MODE:
        return "Вечеринка";
      case GAME_MODES.TURBO:
        return "Турбо";
      default:
        return "Неизвестный";
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full p-6 bg-white/10 backdrop-blur-md rounded-xl shadow-2xl text-white">
        <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          Корги против Биглей
        </h1>

        <p className="mb-6 text-center text-gray-200">
          Выберите режим игры и начните битву между биглями и корги!
        </p>

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

          <button
            onClick={() => setShowRules(true)}
            className="p-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg shadow-lg transition-transform hover:scale-105">
            <span className="block text-lg font-bold">Правила игры</span>
            <span className="text-sm opacity-80">
              Узнайте как играть в международные шашки
            </span>
          </button>
        </div>
      </div>

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}
