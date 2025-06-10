import React, { useState } from "react";

export function GameInstructions() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 shadow-xl">
      <button
        className="flex justify-between items-center w-full"
        onClick={() => setExpanded(!expanded)}>
        <h2 className="text-2xl font-bold text-left bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          Как играть в Турецкие Шашки
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
                В турецких шашках фигуры двигаются по горизонтали и вертикали, а
                не по диагонали.
              </li>
              <li>
                В начальной позиции корги занимают ряды 1-2, а бигли - ряды 5-6.
                Первый и последний ряды остаются пустыми.
              </li>
              <li>
                Дамка (с короной) может ходить на любое количество клеток по
                горизонтали, вертикали и диагонали.
              </li>{" "}
              <li>
                <strong>Захват обязателен!</strong> Если рядом с вашей шашкой
                стоит шашка соперника, за которой есть пустая клетка, вы{" "}
                <em>обязаны</em> "перепрыгнуть" и взять её.
              </li>
              <li>
                Если у нескольких ваших фигур есть возможность захвата, вы
                можете выбрать любую из них.
              </li>
              <li>
                Если выбранная фигура не может делать захваты, но у других есть
                такая возможность, игра покажет сообщение и попросит выбрать
                другую фигуру.
              </li>
              <li>
                Если шашка доходит до последнего ряда, она становится дамкой
                (королём).
              </li>
              <li>
                Если есть возможность взятия, вы <strong>обязаны</strong> её
                использовать.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">Режимы игры:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="font-semibold">Классический</span> -
                стандартные правила игры в турецкие шашки.
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
