import React, { useState } from "react";

export function GameInstructions() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-xl">
      <button
        className="flex justify-between items-center w-full"
        onClick={() => setExpanded(!expanded)}>
        <h2 className="text-2xl font-bold text-left bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          Как играть в Международные Шашки
        </h2>

        <span className="text-2xl transform transition-transform duration-300">
          {expanded ? "−" : "+"}
        </span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 animate-[appear_0.5s_ease-out]">
          <div>
            <h3 className="font-bold text-lg mb-2">Основные правила:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Вы играете за биглей (золотые фигуры), против корги (оранжевые
                фигуры).
              </li>
              <li>
                В международных шашках фигуры двигаются ТОЛЬКО по диагонали на
                темные клетки.
              </li>
              <li>
                В начальной позиции корги занимают ряды 1-4, а бигли - ряды
                7-10. Ряды 5-6 остаются пустыми.
              </li>
              <li>
                Дамка (с короной) может ходить на любое количество клеток по
                диагонали в любом направлении.
              </li>
              <li>
                <strong>Захват обязателен!</strong> Если есть возможность взять
                фигуру противника, вы <em>обязаны</em> это сделать.
              </li>
              <li>
                При множественных вариантах захвата действует правило
                большинства - нужно выбрать вариант с максимальным количеством
                взятых фигур.
              </li>
              <li>
                Если шашка доходит до последнего ряда, она становится дамкой
                (королём).
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">Режимы игры:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="font-semibold">Классический</span> -
                стандартные правила международных шашек.
              </li>
              <li>
                <span className="font-semibold">Безумные прыжки</span> - можно
                перепрыгивать через несколько фигур за один ход.
              </li>
              <li>
                <span className="font-semibold">Режим вечеринки</span> - фигуры
                и доска имеют визуальные эффекты.
              </li>
              <li>
                <span className="font-semibold">Турбо</span> - бот думает и
                ходит быстрее.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">Управление:</h3>
            <ul className="list-disc pl-5">
              <li>Нажмите на фигуру, чтобы выбрать её.</li>
              <li>Нажмите на подсвеченную клетку, чтобы сделать ход.</li>
              <li>
                Используйте кнопку "На весь экран" для полноэкранного режима.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
