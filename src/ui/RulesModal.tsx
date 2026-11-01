import { useModalDialog } from "@/ui/hooks/useModalDialog";

interface RulesModalProps {
  onClose: () => void;
}

const RulesModal = ({ onClose }: RulesModalProps) => {
  const { containerRef, initialFocusRef } = useModalDialog(onClose);

  return (
    <div
      className="fixed inset-0 z-1000 flex items-end justify-center overscroll-contain bg-black/65 pt-[env(safe-area-inset-top,0)] backdrop-blur-md sm:items-center sm:p-4 sm:pl-[max(1rem,env(safe-area-inset-left))] sm:pr-[max(1rem,env(safe-area-inset-right))] sm:pt-[max(1rem,env(safe-area-inset-top))] sm:pb-[max(1rem,env(safe-area-inset-bottom))]"
      role="presentation">
      <div
        ref={containerRef}
        className="flex max-h-[min(90dvh,820px)] w-full max-w-xl flex-col overflow-hidden rounded-t-[1.25rem] border border-zinc-700/90 bg-zinc-900 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] font-sans text-zinc-200 shadow-[0_-12px_48px_rgba(0,0,0,0.55)] [@media(prefers-color-scheme:light)]:border-zinc-300/95 [@media(prefers-color-scheme:light)]:bg-zinc-50 [@media(prefers-color-scheme:light)]:text-zinc-900 [@media(prefers-color-scheme:light)]:shadow-[0_-12px_48px_rgba(24,24,27,0.12)] sm:m-auto sm:max-h-[min(82dvh,760px)] sm:rounded-[1.25rem] sm:p-6 sm:shadow-[0_24px_64px_rgba(0,0,0,0.5)] sm:[@media(prefers-color-scheme:light)]:shadow-[0_24px_64px_rgba(24,24,27,0.1)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-modal-title">
        <h2
          id="rules-modal-title"
          className="mb-2 shrink-0 text-center font-display text-[clamp(1.1rem,3.8vw,1.5rem)] font-bold leading-tight text-orange-400 [@media(prefers-color-scheme:light)]:text-orange-700">
          Правила шашек
        </h2>
        <p className="mb-3 shrink-0 text-center text-[0.8125rem] leading-snug text-zinc-400 [@media(prefers-color-scheme:light)]:text-zinc-600">
          Ниже — международные шашки 10×10; отличия русских шашек 8×8 —
          отдельным разделом.
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
              Простая шашка бьёт соседнюю фигуру по диагонали — вперёд и назад
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              Дамка может взять фигуру на любом расстоянии по диагонали
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              Множественные взятия обязательны, если есть возможность продолжить
              захват
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              Побитые фигуры снимаются после завершения хода: через одну фигуру
              нельзя прыгнуть дважды, и она загораживает путь (турецкий удар)
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              Если простая шашка проходит дамочное поле во время взятия и может
              бить дальше, она продолжает бить как простая и дамкой не
              становится. Дамкой она станет, только если закончит ход на
              последней горизонтали
            </li>
          </ul>

          <h3 className="mb-1.5 mt-[0.85rem] font-display text-[0.95rem] font-bold text-orange-300 [@media(prefers-color-scheme:light)]:text-orange-700">
            Цель игры:
          </h3>
          <p className="mb-3.5 text-sm leading-snug">
            Захватить все фигуры противника или лишить его возможности хода.
          </p>

          <h3 className="mb-1.5 mt-[0.85rem] font-display text-[0.95rem] font-bold text-orange-300 [@media(prefers-color-scheme:light)]:text-orange-700">
            Ничья:
          </h3>
          <ul className="mb-3.5 list-disc pl-[1.15rem] [&>li::marker]:text-orange-400 [@media(prefers-color-scheme:light)]:[&>li::marker]:text-orange-600">
            <li className="mb-1.5 text-sm leading-snug">
              Одна и та же позиция повторилась трижды
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              25 ходов подряд каждая сторона ходила только дамками без взятий
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              Три фигуры, среди которых есть дамка, против одинокой дамки — 16
              ходов; две фигуры с дамкой или одна дамка против дамки — 5 ходов
            </li>
          </ul>

          <h3 className="mb-1.5 mt-[0.85rem] font-display text-[0.95rem] font-bold text-orange-300 [@media(prefers-color-scheme:light)]:text-orange-700">
            Русские шашки (8×8):
          </h3>
          <ul className="mb-3.5 list-disc pl-[1.15rem] [&>li::marker]:text-orange-400 [@media(prefers-color-scheme:light)]:[&>li::marker]:text-orange-600">
            <li className="mb-1.5 text-sm leading-snug">
              По 12 шашек у каждой стороны, первыми ходят бигли (белые)
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              Правила большинства нет: можно выбрать любую серию взятий, но бить
              надо до конца
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              Шашка, дошедшая до последней горизонтали во время взятия, сразу
              становится дамкой и продолжает бить как дамка
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              Дамка после взятия должна встать на поле, с которого бой
              продолжается, если такое есть
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              Ничья: троекратное повторение, 15 ходов только дамками без взятий,
              три дамки против одной за 15 ходов не выиграли
            </li>
          </ul>

          <h3 className="mb-1.5 mt-[0.85rem] font-display text-[0.95rem] font-bold text-orange-300 [@media(prefers-color-scheme:light)]:text-orange-700">
            Управление:
          </h3>
          <ul className="mb-3.5 list-disc pl-[1.15rem] [&>li::marker]:text-orange-400 [@media(prefers-color-scheme:light)]:[&>li::marker]:text-orange-600">
            <li className="mb-1.5 text-sm leading-snug">
              Мышь или касание: выберите свою фигуру, затем поле. Серию взятий
              проходите по шагам
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              Клавиатура: стрелки — курсор по доске, Enter или пробел — выбрать,
              Esc — снять выбор
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              Z — отменить ход, H — подсказка
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              Кнопка «2D» переключает плоскую доску — она легче для слабых
              устройств
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              Партия сохраняется автоматически: её можно продолжить из главного
              меню
            </li>
          </ul>

          <h3 className="mb-1.5 mt-[0.85rem] font-display text-[0.95rem] font-bold text-orange-300 [@media(prefers-color-scheme:light)]:text-orange-700">
            Игровые режимы:
          </h3>
          <ul className="mb-3.5 list-disc pl-[1.15rem] [&>li::marker]:text-orange-400 [@media(prefers-color-scheme:light)]:[&>li::marker]:text-orange-600">
            <li className="mb-1.5 text-sm leading-snug">
              <strong>Классический</strong> - стандартные правила международных
              шашек
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              <strong>Безумные прыжки</strong> - простая шашка бьёт как дамка:
              после взятия может встать на любое свободное поле за фигурой
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              <strong>Режим вечеринки</strong> - визуальные эффекты и анимации
            </li>
            <li className="mb-1.5 text-sm leading-snug">
              <strong>Турбо</strong> - бот ходит почти без пауз
            </li>
          </ul>
        </div>

        <button
          ref={initialFocusRef}
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
