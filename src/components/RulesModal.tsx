import { useCallback, useEffect, useRef } from "react";

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
    <div
      className="fixed inset-0 z-1000 flex items-end justify-center overscroll-contain bg-black/65 pt-[env(safe-area-inset-top,0)] backdrop-blur-md sm:items-center sm:p-4 sm:pl-[max(1rem,env(safe-area-inset-left))] sm:pr-[max(1rem,env(safe-area-inset-right))] sm:pt-[max(1rem,env(safe-area-inset-top))] sm:pb-[max(1rem,env(safe-area-inset-bottom))]"
      role="presentation">
      <div
        className="flex max-h-[min(90dvh,820px)] w-full max-w-xl flex-col overflow-hidden rounded-t-[1.25rem] border border-zinc-700/90 bg-zinc-900 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] font-sans text-zinc-200 shadow-[0_-12px_48px_rgba(0,0,0,0.55)] [@media(prefers-color-scheme:light)]:border-zinc-300/95 [@media(prefers-color-scheme:light)]:bg-zinc-50 [@media(prefers-color-scheme:light)]:text-zinc-900 [@media(prefers-color-scheme:light)]:shadow-[0_-12px_48px_rgba(24,24,27,0.12)] sm:m-auto sm:max-h-[min(82dvh,760px)] sm:rounded-[1.25rem] sm:p-6 sm:shadow-[0_24px_64px_rgba(0,0,0,0.5)] sm:[@media(prefers-color-scheme:light)]:shadow-[0_24px_64px_rgba(24,24,27,0.1)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-modal-title">
        <h2
          id="rules-modal-title"
          className="mb-2 shrink-0 text-center font-display text-[clamp(1.1rem,3.8vw,1.5rem)] font-bold leading-tight text-orange-400 [@media(prefers-color-scheme:light)]:text-orange-700">
          Правила международных шашек (10×10)
        </h2>
        <p className="mb-3 shrink-0 text-center text-[0.8125rem] leading-snug text-zinc-400 [@media(prefers-color-scheme:light)]:text-zinc-600">
          Краткая памятка: игра только по тёмным клеткам, взятия обязательны.
        </p>
        <div className="mb-3 min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain pr-1">
          <h3 className="mb-1.5 mt-0 font-display text-[0.95rem] font-bold text-orange-300 [@media(prefers-color-scheme:light)]:text-orange-700">
            Основные правила:
          </h3>
          <ul className="mb-3.5 list-disc pl-[1.15rem] [&>li::marker]:text-orange-400 [@media(prefers-color-scheme:light)]:[&>li::marker]:text-orange-600">
            <li className="mb-1.5 text-sm leading-snug">
              Игра ведется на доске 10×10 клеток, используются ТОЛЬКО темные
              (черные) клетки
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              В начальной позиции корги занимают ряды 1-4, а бигли - ряды 7-10.
              Ряды 5-6 остаются пустыми.
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              Корги (оранжевые) и Бигли (золотые) ходят ТОЛЬКО по диагоналям
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              Простые шашки могут ходить только вперед по диагонали на соседнюю
              клетку
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              Превращение в дамку происходит при достижении противоположного
              края доски
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              Дамка может ходить на любое количество клеток по диагонали в любом
              направлении
            </li>
          </ul>
          <h3 className="mb-1.5 mt-[0.85rem] font-display text-[0.95rem] font-bold text-orange-300 [@media(prefers-color-scheme:light)]:text-orange-700">
            Правила взятия (обязательные):
          </h3>
          <ul className="mb-3.5 list-disc pl-[1.15rem] [&>li::marker]:text-orange-400 [@media(prefers-color-scheme:light)]:[&>li::marker]:text-orange-600">
            <li className="mb-1.5 text-sm leading-snug">
              <strong>Взятие фигуры противника ОБЯЗАТЕЛЬНО!</strong>
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              <strong>Правило большинства:</strong> при наличии нескольких
              вариантов взятия необходимо выбрать тот, который захватывает
              наибольшее количество фигур
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              Взятие происходит перепрыгиванием через фигуру противника по
              диагонали
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              Простая шашка берет только по диагонали на соседнюю клетку
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              Дамка может взять фигуру на любом расстоянии по диагонали
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              Множественные взятия обязательны, если есть возможность продолжить
              захват
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              Если простая шашка достигает дамочного поля в процессе взятия, она
              становится дамкой но продолжает ход как простая шашка
            </li>
          </ul>

          <h3 className="mb-1.5 mt-[0.85rem] font-display text-[0.95rem] font-bold text-orange-300 [@media(prefers-color-scheme:light)]:text-orange-700">
            Цель игры:
          </h3>
          <p className="mb-3.5 text-sm leading-snug">
            Захватить все фигуры противника или лишить его возможности хода.
          </p>

          <h3 className="mb-1.5 mt-[0.85rem] font-display text-[0.95rem] font-bold text-orange-300 [@media(prefers-color-scheme:light)]:text-orange-700">
            Игровые режимы:
          </h3>
          <ul className="mb-3.5 list-disc pl-[1.15rem] [&>li::marker]:text-orange-400 [@media(prefers-color-scheme:light)]:[&>li::marker]:text-orange-600">
            <li className="mb-1.5 text-sm leading-snug">
              <strong>Классический</strong> - стандартные правила международных
              шашек
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              <strong>Безумные прыжки</strong> - возможны длинные прыжки через
              всю доску
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              <strong>Режим вечеринки</strong> - визуальные эффекты и анимации
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              <strong>Турбо</strong> - ускоренный темп игры с быстрым ботом
            </li>
          </ul>
        </div>

        <button
          ref={closeButtonRef}
          type="button"
          className="min-h-11 w-full shrink-0 cursor-pointer rounded-xl border-none bg-orange-600 px-4 py-2.5 text-[0.9375rem] font-bold text-zinc-950 transition-[background-color,filter] motion-reduce:transition-none hover:bg-orange-500 hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300 [@media(prefers-color-scheme:light)]:bg-orange-600 [@media(prefers-color-scheme:light)]:text-zinc-50 [@media(prefers-color-scheme:light)]:hover:bg-orange-700"
          onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  );
};

export default RulesModal;
