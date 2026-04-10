import { useCallback, useEffect, useRef } from "react";
import "./RulesModal.css";

interface RulesModalProps {
  onClose: () => void;
}

const RulesModal = ({ onClose }: RulesModalProps) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    const previousActive = document.activeElement;
    closeButtonRef.current?.focus();
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousActive instanceof HTMLElement && document.contains(previousActive)) {
        previousActive.focus();
      }
    };
  }, [handleKeyDown]);

  return (
    <div className="rules-modal-overlay" role="presentation">
      <div
        className="rules-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-modal-title">
        <h2 id="rules-modal-title">
          Правила международных шашек (10×10)
        </h2>
        <p className="rules-lead">
          Краткая памятка: игра только по тёмным клеткам, взятия обязательны.
        </p>
        <div className="rules-content">
          <h3>Основные правила:</h3>
          <ul>
            <li>
              Игра ведется на доске 10×10 клеток, используются ТОЛЬКО темные
              (черные) клетки
            </li>
            <li>
              В начальной позиции корги занимают ряды 1-4, а бигли - ряды 7-10.
              Ряды 5-6 остаются пустыми.
            </li>
            <li>
              Корги (оранжевые) и Бигли (золотые) ходят ТОЛЬКО по диагоналям
            </li>
            <li>
              Простые шашки могут ходить только вперед по диагонали на соседнюю
              клетку
            </li>
            <li>
              Превращение в дамку происходит при достижении противоположного
              края доски
            </li>
            <li>
              Дамка может ходить на любое количество клеток по диагонали в любом
              направлении
            </li>
          </ul>
          <h3>Правила взятия (обязательные):</h3>
          <ul>
            <li>
              <strong>Взятие фигуры противника ОБЯЗАТЕЛЬНО!</strong>
            </li>
            <li>
              <strong>Правило большинства:</strong> при наличии нескольких
              вариантов взятия необходимо выбрать тот, который захватывает
              наибольшее количество фигур
            </li>
            <li>
              Взятие происходит перепрыгиванием через фигуру противника по
              диагонали
            </li>
            <li>Простая шашка берет только по диагонали на соседнюю клетку</li>
            <li>Дамка может взять фигуру на любом расстоянии по диагонали</li>
            <li>
              Множественные взятия обязательны, если есть возможность продолжить
              захват
            </li>
            <li>
              Если простая шашка достигает дамочного поля в процессе взятия, она
              становится дамкой но продолжает ход как простая шашка
            </li>
          </ul>

          <h3>Цель игры:</h3>
          <p>
            Захватить все фигуры противника или лишить его возможности хода.
          </p>

          <h3>Игровые режимы:</h3>
          <ul>
            <li>
              <strong>Классический</strong> - стандартные правила международных
              шашек
            </li>
            <li>
              <strong>Безумные прыжки</strong> - возможны длинные прыжки через
              всю доску
            </li>
            <li>
              <strong>Режим вечеринки</strong> - визуальные эффекты и анимации
            </li>
            <li>
              <strong>Турбо</strong> - ускоренный темп игры с быстрым ботом
            </li>
          </ul>
        </div>

        <button
          ref={closeButtonRef}
          type="button"
          className="close-button"
          onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  );
};

export default RulesModal;
