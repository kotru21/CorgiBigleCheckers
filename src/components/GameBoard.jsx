import React, { useState } from "react";
import { Board3D } from "./Board3D";
import { useGame } from "../contexts/GameContext.jsx";
import {
  getValidMovesWithCapturePriority,
  executeMove,
  getPiecesWithCaptures,
} from "../services/MoveService";
import { checkGameStatus, createInitialBoard } from "../services/BoardService";
import { PLAYER, PLAYER_KING } from "../models/Constants";
import { useBotAI } from "../hooks/useBotAI"; // Добавляем импорт хука для бота

export function GameBoard({ onReturnToMenu }) {
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
  } = useGame();

  // Подключаем AI бота
  useBotAI();

  const [performanceMode, setPerformanceMode] = useState("high");
  const [showFpsInfo, setShowFpsInfo] = useState(false);
  const [currentFps, setCurrentFps] = useState(60); // Добавляем состояние для хранения текущего FPS

  // Функция для получения данных о производительности от Board3D
  const handlePerformanceData = (fps, mode) => {
    setCurrentFps(fps); // Обновляем значение FPS в состоянии

    // Обновляем режим производительности только при его изменении
    if (mode !== performanceMode) {
      setPerformanceMode(mode);
    }
  };
  // Выбор фигуры или ход
  const handlePieceSelect = (row, col) => {
    // Если игра окончена, ничего не делаем
    if (gameOver) return;

    // Если не ход игрока, ничего не делаем
    if (!playerTurn) return;

    const piece = board[row][col];
    const isPlayerPiece = piece === PLAYER || piece === PLAYER_KING;

    // Если уже выбрана фигура, проверяем возможность хода
    if (selectedPiece) {
      // Проверяем, является ли выбранная клетка допустимым ходом
      const isValidMove = validMoves.some(
        (move) => move.row === row && move.col === col
      );
      if (isValidMove) {
        // Выполняем ход
        const newBoard = executeMove(
          board,
          selectedPiece.row,
          selectedPiece.col,
          row,
          col
        );

        setBoard(newBoard);

        // Сбрасываем выбор и передаем ход боту
        setSelectedPiece(null);
        setValidMoves([]);
        setPlayerTurn(false);
        setGameMessage("Ход корги...");

        // Проверяем состояние игры после хода игрока
        const gameStatus = checkGameStatus(newBoard);
        if (gameStatus) {
          handleGameOver(gameStatus);
        }
      } else if (isPlayerPiece) {
        // Если выбрана другая фигура игрока, выбираем ее
        const { moves, mustCapture } = getValidMovesWithCapturePriority(
          board,
          row,
          col
        );
        setSelectedPiece({ row, col });
        setValidMoves(moves);

        // Показываем сообщение о обязательном захвате
        if (mustCapture && moves.length === 0) {
          setGameMessage("У этой фигуры нет захватов. Выберите другую фигуру!");
        } else if (mustCapture && moves.length > 0) {
          setGameMessage("Захват обязателен! Выберите ход для захвата.");
        } else {
          setGameMessage("Выберите поле для хода");
        }
      } else {
        // Если выбрана пустая клетка или фигура бота, сбрасываем выбор
        setSelectedPiece(null);
        setValidMoves([]);
      }
    } else if (isPlayerPiece) {
      // Выбираем фигуру игрока
      const { moves, mustCapture } = getValidMovesWithCapturePriority(
        board,
        row,
        col
      );
      setSelectedPiece({ row, col });
      setValidMoves(moves);

      // Показываем сообщение о обязательном захвате
      if (mustCapture && moves.length === 0) {
        setGameMessage("У этой фигуры нет захватов. Выберите другую фигуру!");
      } else if (mustCapture && moves.length > 0) {
        setGameMessage("Захват обязателен! Выберите ход для захвата.");
      } else {
        setGameMessage("Выберите поле для хода");
      }
    }
  };

  const handleGameOver = (winner) => {
    setGameOver(true);
    setGameMessage(
      winner === PLAYER
        ? "Вы победили! Бигли одержали верх над корги!"
        : "Вы проиграли! Корги оказались хитрее!"
    );
  };

  return (
    <div
      id="chess-board-container"
      className="fixed inset-0 w-screen h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Статус игры */}
      <div className="absolute top-2 left-2 z-10 px-3 py-1 bg-black/40 backdrop-blur-sm rounded-md text-white font-medium">
        {gameMessage}
      </div>
      {/* Индикатор производительности - обновляем, чтобы отображать текущий FPS из состояния */}
      <div
        className="absolute mr-12 top-2 right-20 z-10 px-3 py-1 bg-black/40 backdrop-blur-sm rounded-md text-white font-medium cursor-pointer"
        onClick={() => setShowFpsInfo(!showFpsInfo)}>
        <span
          className={`inline-block w-3 h-3 rounded-full mr-2 ${
            performanceMode === "high"
              ? "bg-green-500"
              : performanceMode === "medium"
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}></span>
        {showFpsInfo ? `${currentFps} FPS` : "Производительность"}
      </div>
      {/* Кнопка возврата в меню - теперь использует переданную функцию */}
      <button
        onClick={onReturnToMenu}
        className="absolute top-2 right-2 z-10 px-3 py-1 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-md text-white transition-colors">
        Меню
      </button>
      {/* Игровая подсказка */}
      {playerTurn && !gameOver && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-md text-white text-sm">
          {selectedPiece ? "Выберите поле для хода" : "Выберите бигля для хода"}
        </div>
      )}{" "}
      {/* Доска на весь экран */}
      <div className="w-full h-full">
        <Board3D
          board={board}
          onPieceSelect={handlePieceSelect}
          selectedPiece={selectedPiece}
          validMoves={validMoves}
          onPerformanceData={handlePerformanceData}
          piecesWithCaptures={
            playerTurn ? getPiecesWithCaptures(board, true) : []
          }
        />
      </div>
      {/* Показ статуса окончания игры */}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-2xl text-center max-w-md mx-4">
            <h2 className="text-2xl font-bold mb-4 text-white">
              {gameMessage}
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  // Сброс игры и начало новой
                  const newBoard = createInitialBoard();
                  setBoard(newBoard);
                  setGameOver(false);
                  setPlayerTurn(true);
                  setGameMessage("Новая игра! Ваш ход!");
                  setSelectedPiece(null);
                  setValidMoves([]);
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg shadow-lg hover:from-purple-600 hover:to-blue-600 transition-colors">
                Новая игра
              </button>
              <button
                onClick={onReturnToMenu}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-700 text-white rounded-lg shadow-lg hover:from-gray-600 hover:to-gray-800 transition-colors">
                В меню
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
