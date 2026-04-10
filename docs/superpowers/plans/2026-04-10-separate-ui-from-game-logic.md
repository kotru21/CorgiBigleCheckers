# Separate UI from game logic — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать смешение доменной логики и UI во всех ранее отмеченных «мегакомпонентах», вынеся повторяющуюся инициализацию партии в store/чистые функции, игровой контроллер хода человека — в хук, 3D-визуал — в чистые билдеры и презентационные пропсы, и покрыть новые чистые модули тестами Vitest.

**Architecture:** Чистые функции в `src/game/` (состояние партии, подсветка клеток, дескрипторы фигур) тестируются в изоляции. Zustand-экшены тонко вызывают эти функции. `GameBoard` становится композицией хука `useGameBoardController` и презентационных блоков HUD/оверлея. `Board3D` маппит доску через `buildPieceDescriptors`; `PieceMesh` не знает правил «только бигль», только флаг `pointerTarget`. `useBoardSquares` читает визуальное состояние клетки из `squareVisualState`.

**Tech Stack:** React 19, TypeScript, Vite, Zustand, Vitest (node), React Three Fiber (без тестов рендера — только чистая логика рядом).

**Контекст:** Навык writing-plans рекомендует работу в отдельном git worktree; перед первым коммитом создайте worktree или отдельную ветку `refactor/separate-ui-logic`, чтобы не блокировать параллельные задачи.

---

## File map (создать / изменить)

| Путь | Ответственность |
|------|-----------------|
| `src/game/matchLifecycle.ts` | Чистые срезы состояния для старта партии в режиме и рестарта в текущем режиме |
| `src/game/matchLifecycle.test.ts` | Тесты сообщений и полей среза |
| `src/game/squareVisualState.ts` | Флаги подсветки клетки (выбрана, ход, захват, hover, тёмная клетка); только типы с `row`/`col`, без импорта из `components/`) |
| `src/game/squareVisualState.test.ts` | Тесты комбинаций флагов |
| `src/components/Board3D/buildPieceDescriptors.ts` | Список дескрипторов фигур для рендера + `pointerTarget` |
| `src/components/Board3D/buildPieceDescriptors.test.ts` | Тесты EMPTY, king, анимация |
| `src/shared/types/pieceAnimation.types.ts` | `PieceAnimationInfo` (убрать зависимость `useBotAI` → `components`) |
| `src/hooks/useTransientActionLock.ts` | Реф + cooldown для «Новая игра» (как сейчас в `GameBoard`) |
| `src/hooks/useGameBoardController.ts` | Вся оркестрация хода игрока, окончания партии, FPS state, связь с `useBotAI` |
| `src/components/GameBoardHud.tsx` | Верхняя панель: статус, кнопки FPS/правила/режим/меню |
| `src/components/GameOverSheet.tsx` | Модалка конца игры: кнопки новая игра / в меню |
| `src/store/gameStore.ts` | Экшены `beginMatch`, `restartMatch` на базе `matchLifecycle` |
| `src/components/GameBoard.tsx` | Только композиция и локальный UI state (модалки открыты/закрыты) |
| `src/components/MainMenu.tsx` | Вызов `beginMatch` из store |
| `src/components/ModeSelector.tsx` | Вызов `beginMatch` из store |
| `src/components/GameControls.tsx` | Вызов `restartMatch` из store |
| `src/components/Board3D/Board3D.tsx` | Использовать `buildPieceDescriptors`, проброс `pointerTarget` |
| `src/components/Board3D/PieceMesh.tsx` | Проп `pointerTarget`, убрать проверку `type === "beagle"` для клика |
| `src/components/Board3D/hooks/useBoardSquares.tsx` | Делегировать классификацию в `squareVisualState` |
| `src/components/Board3D/types.ts` | Реэкспорт `PieceAnimationInfo` из shared или удаление дубля |
| `src/hooks/useBotAI.ts` | Импорт типа анимации из `shared`, не из `Board3D` |

---

### Task 1: Чистый срез партии `matchLifecycle`

**Files:**

- Create: `src/game/matchLifecycle.ts`
- Create: `src/game/matchLifecycle.test.ts`

- [ ] **Step 1: Написать падающий тест**

```ts
import { describe, it, expect } from "vitest";
import { GAME_MODES } from "@shared/config/constants";
import {
  createMatchSliceForMode,
  createRestartSliceKeepingMode,
} from "./matchLifecycle";

describe("matchLifecycle", () => {
  it("createMatchSliceForMode sets message from mode", () => {
    const classic = createMatchSliceForMode(GAME_MODES.CLASSIC);
    expect(classic.gameMode).toBe(GAME_MODES.CLASSIC);
    expect(classic.gameMessage).toBe("Классика · ваш ход");
    expect(classic.playerTurn).toBe(true);
    expect(classic.gameOver).toBe(false);
    expect(classic.selectedPiece).toBeNull();
    expect(classic.validMoves).toEqual([]);
    expect(classic.board).toHaveLength(10);
    expect(classic.board[0]).toHaveLength(10);
  });

  it("createRestartSliceKeepingMode does not include gameMode", () => {
    const slice = createRestartSliceKeepingMode(GAME_MODES.PARTY_MODE);
    expect(slice.gameMessage).toBe("Вечеринка · ваш ход");
    expect("gameMode" in slice).toBe(false);
  });
});
```

- [ ] **Step 2: Запустить тест — ожидаем FAIL**

Run: `npm run test -- src/game/matchLifecycle.test.ts`

Expected: FAIL (cannot find module `./matchLifecycle` or missing exports)

- [ ] **Step 3: Минимальная реализация**

```ts
import { createInitialBoard } from "../services/BoardService";
import { getModeStartMessage } from "../utils/modeHelpers";
import type {
  Board,
  GameMode,
  Move,
  Position,
} from "@shared/types/game.types";

export interface MatchSliceForMode {
  board: Board;
  gameMode: GameMode;
  playerTurn: boolean;
  gameOver: boolean;
  gameMessage: string;
  selectedPiece: Position | null;
  validMoves: Move[];
}

export function createMatchSliceForMode(mode: GameMode): MatchSliceForMode {
  return {
    board: createInitialBoard() as Board,
    gameMode: mode,
    playerTurn: true,
    gameOver: false,
    gameMessage: getModeStartMessage(mode),
    selectedPiece: null,
    validMoves: [],
  };
}

export interface RestartSlice {
  board: Board;
  playerTurn: boolean;
  gameOver: boolean;
  gameMessage: string;
  selectedPiece: Position | null;
  validMoves: Move[];
}

export function createRestartSliceKeepingMode(
  currentMode: GameMode
): RestartSlice {
  return {
    board: createInitialBoard() as Board,
    playerTurn: true,
    gameOver: false,
    gameMessage: getModeStartMessage(currentMode),
    selectedPiece: null,
    validMoves: [],
  };
}
```

- [ ] **Step 4: Запустить тест — ожидаем PASS**

Run: `npm run test -- src/game/matchLifecycle.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/matchLifecycle.ts src/game/matchLifecycle.test.ts
git commit -m "feat(game): add pure match lifecycle slices for store resets"
```

---

### Task 2: Экшены Zustand `beginMatch` / `restartMatch`

**Files:**

- Modify: `src/store/gameStore.ts`
- Modify: `src/components/MainMenu.tsx`
- Modify: `src/components/ModeSelector.tsx`
- Modify: `src/components/GameControls.tsx`

- [ ] **Step 1: Расширить интерфейс и реализацию store**

В `GameStore` добавьте:

```ts
beginMatch: (mode: GameMode) => void;
restartMatch: () => void;
```

Внутри `create`:

```ts
import {
  createMatchSliceForMode,
  createRestartSliceKeepingMode,
} from "../game/matchLifecycle";

// ...
beginMatch: (mode) => set(() => createMatchSliceForMode(mode)),
restartMatch: () =>
  set((state) => ({
    ...state,
    ...createRestartSliceKeepingMode(state.gameMode),
  })),
```

Существующий `resetGame` оставьте для обратной совместимости, но добавьте в его теле вызов той же логики, что и `restartMatch`, **или** пометьте `@deprecated` и переведите все вызовы на `restartMatch` в рамках этого же шага (предпочтительно: один путь — `restartMatch` + `beginMatch`).

- [ ] **Step 2: Упростить `MainMenu`**

Замените тело `handleSelectMode`:

```ts
const beginMatch = useGame((s) => s.beginMatch);

const handleSelectMode = (mode: GameMode) => {
  beginMatch(mode);
  onStartGame();
};
```

Удалите прямые импорты `createInitialBoard`, `getModeStartMessage` из этого файла, если они больше не нужны.

- [ ] **Step 3: Упростить `ModeSelector`**

```ts
const beginMatch = useGame((s) => s.beginMatch);

const handleSelectMode = (mode: GameMode) => {
  beginMatch(mode);
  onClose();
};
```

- [ ] **Step 4: Упростить `GameControls`**

```ts
const restartMatch = useGame((s) => s.restartMatch);

const handleRestart = () => {
  restartMatch();
};
```

Удалите импорт `createInitialBoard`.

- [ ] **Step 5: Проверка типов и линт**

Run: `npm run typecheck`

Expected: exit code 0

Run: `npm run lint`

Expected: exit code 0 (или только известные прежде предупреждения)

- [ ] **Step 6: Commit**

```bash
git add src/store/gameStore.ts src/components/MainMenu.tsx src/components/ModeSelector.tsx src/components/GameControls.tsx
git commit -m "refactor(store): centralize beginMatch and restartMatch"
```

---

### Task 3: Тип `PieceAnimationInfo` в shared (разрыв цикла импортов)

**Files:**

- Create: `src/shared/types/pieceAnimation.types.ts`
- Modify: `src/components/Board3D/types.ts` (импорт и реэкспорт или удаление дубля)
- Modify: `src/hooks/useBotAI.ts`
- Modify: любые файлы, импортирующие `PieceAnimationInfo` из `./Board3D`

- [ ] **Step 1: Создать shared-тип**

```ts
export interface PieceAnimationInfo {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  animationId: string;
}
```

- [ ] **Step 2: В `Board3D/types.ts`** импортируйте из `@shared/types/pieceAnimation.types` и реэкспортируйте `export type { PieceAnimationInfo } from "@shared/types/pieceAnimation.types"` **или** удалите локальное определение и добавьте реэкспорт одной строкой, чтобы внешние `import { type PieceAnimationInfo } from "./Board3D"` не сломались.

- [ ] **Step 3: В `useBotAI.ts`** замените импорт на `@shared/types/pieceAnimation.types`.

- [ ] **Step 4: `npm run typecheck`** — ожидаем 0 ошибок.

- [ ] **Step 5: Commit**

```bash
git add src/shared/types/pieceAnimation.types.ts src/components/Board3D/types.ts src/hooks/useBotAI.ts
git commit -m "refactor(types): move PieceAnimationInfo to shared"
```

---

### Task 4: Блокировка повторного рестарта (cooldown)

**Files:**

- Create: `src/hooks/useTransientActionLock.ts`

- [ ] **Step 1: Реализация хука**

```ts
import { useRef, useCallback } from "react";

/**
 * Повторяет поведение boardCreationRef + setTimeout из GameBoard:
 * игнорирует повторные вызовы, пока не истечёт cooldownMs.
 */
export function useTransientActionLock(cooldownMs: number) {
  const busyRef = useRef(false);

  const runLocked = useCallback(
    (action: () => void) => {
      if (busyRef.current) {
        return;
      }
      busyRef.current = true;
      try {
        action();
      } finally {
        window.setTimeout(() => {
          busyRef.current = false;
        }, cooldownMs);
      }
    },
    [cooldownMs]
  );

  return runLocked;
}
```

- [ ] **Step 2: `npm run typecheck`**

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useTransientActionLock.ts
git commit -m "feat(hooks): add transient action lock for restarts"
```

---

### Task 5: Чистая классификация подсветки клетки

**Files:**

- Create: `src/game/squareVisualState.ts`
- Create: `src/game/squareVisualState.test.ts`
- Modify: `src/components/Board3D/hooks/useBoardSquares.tsx`

- [ ] **Step 1: Падающий тест**

```ts
import { describe, it, expect } from "vitest";
import { getSquareInteractionFlags } from "./squareVisualState";
import type { Move, Position } from "@shared/types/game.types";

describe("getSquareInteractionFlags", () => {
  it("marks dark squares by coordinates", () => {
    expect(getSquareInteractionFlags(0, 1).isDarkSquare).toBe(true);
    expect(getSquareInteractionFlags(0, 0).isDarkSquare).toBe(false);
  });

  it("detects selected piece square", () => {
    const selected: Position = { row: 2, col: 3 };
    const flags = getSquareInteractionFlags(2, 3, {
      selectedPiece: selected,
      validMoves: [] as Move[],
      piecesWithCaptures: [],
      hoveredSquare: null,
    });
    expect(flags.isSelected).toBe(true);
  });

  it("detects valid move target", () => {
    const moves: Move[] = [{ row: 4, col: 5 }];
    const flags = getSquareInteractionFlags(4, 5, {
      selectedPiece: { row: 3, col: 4 },
      validMoves: moves,
      piecesWithCaptures: [],
      hoveredSquare: null,
    });
    expect(flags.isValidMove).toBe(true);
  });
});
```

- [ ] **Step 2: Запустить тест — FAIL**

Run: `npm run test -- src/game/squareVisualState.test.ts`

- [ ] **Step 3: Реализация**

```ts
import { boardUtils } from "../utils/gameHelpers";
import type { Move, Position } from "@shared/types/game.types";

/** Достаточно row/col; массив совместим с `CaptureInfo[]` из Board3D. */
export interface CaptureSquareRef {
  row: number;
  col: number;
}

export interface SquareOverlayInput {
  selectedPiece: Position | null;
  validMoves: Move[];
  piecesWithCaptures: CaptureSquareRef[];
  hoveredSquare: Position | null;
}

export interface SquareFlags {
  isDarkSquare: boolean;
  isSelected: boolean;
  isValidMove: boolean;
  hasCapturePiece: boolean;
  isHovered: boolean;
}

export function getSquareInteractionFlags(
  row: number,
  col: number,
  overlay?: SquareOverlayInput
): SquareFlags {
  const isDarkSquare = boardUtils.isDarkSquare(row, col);
  if (!overlay) {
    return {
      isDarkSquare,
      isSelected: false,
      isValidMove: false,
      hasCapturePiece: false,
      isHovered: false,
    };
  }

  const {
    selectedPiece,
    validMoves,
    piecesWithCaptures,
    hoveredSquare,
  } = overlay;

  const isSelected =
    selectedPiece?.row === row && selectedPiece?.col === col;
  const isValidMove = validMoves.some((m) => m.row === row && m.col === col);
  const hasCapturePiece = piecesWithCaptures.some(
    (p) => p.row === row && p.col === col
  );
  const isHovered =
    hoveredSquare?.row === row && hoveredSquare?.col === col;

  return {
    isDarkSquare,
    isSelected,
    isValidMove,
    hasCapturePiece,
    isHovered,
  };
}
```

- [ ] **Step 4: Подключить в `useBoardSquares`**

Внутри цикла `for` замените ручные вычисления `isEven`, `isDarkSquare`, `isSelected`, `isValidMove`, `hasCapturePiece`, `isHovered` на один вызов:

```ts
const flags = getSquareInteractionFlags(row, col, {
  selectedPiece,
  validMoves,
  piecesWithCaptures,
  hoveredSquare,
});
```

Используйте `flags.isDarkSquare` в `onClick`, остальные флаги — в ветках материала как раньше.

- [ ] **Step 5: Тест PASS + typecheck**

Run: `npm run test -- src/game/squareVisualState.test.ts`

Run: `npm run typecheck`

- [ ] **Step 6: Commit**

```bash
git add src/game/squareVisualState.ts src/game/squareVisualState.test.ts src/components/Board3D/hooks/useBoardSquares.tsx
git commit -m "refactor(game): extract square highlight flags for Board3D"
```

---

### Task 6: Дескрипторы фигур для `Board3D`

**Files:**

- Create: `src/components/Board3D/buildPieceDescriptors.ts`
- Create: `src/components/Board3D/buildPieceDescriptors.test.ts`
- Modify: `src/components/Board3D/Board3D.tsx`

- [ ] **Step 1: Падающий тест**

```ts
import { describe, it, expect } from "vitest";
import { EMPTY, GAME_MODES } from "@shared/config/constants";
import { buildPieceDescriptors } from "./buildPieceDescriptors";
import type { Board } from "@shared/types/game.types";

describe("buildPieceDescriptors", () => {
  it("returns empty list for empty board", () => {
    const board = Array.from({ length: 10 }, () =>
      Array.from({ length: 10 }, () => EMPTY)
    ) as Board;
    expect(buildPieceDescriptors(board, null, null)).toEqual([]);
  });
});
```

(После реализации добавьте кейс с одной фигурой beagle и проверкой `pointerTarget: true`, corgi — `false`, и `animationId` при совпадении `currentAnimation`.)

- [ ] **Step 2: Реализация**

```ts
import { EMPTY } from "@shared/config/constants";
import { pieceUtils } from "../../utils/gameHelpers";
import type { Board } from "@shared/types/game.types";
import type { Position } from "@shared/types/game.types";
import type { PieceAnimationInfo } from "@shared/types/pieceAnimation.types";

export interface PieceDescriptor {
  key: string;
  boardRow: number;
  boardCol: number;
  type: "beagle" | "corgi";
  isKing: boolean;
  pointerTarget: boolean;
  animationId: string | null;
}

export function buildPieceDescriptors(
  board: Board,
  selectedPiece: Position | null,
  currentAnimation: PieceAnimationInfo | null | undefined
): PieceDescriptor[] {
  const out: PieceDescriptor[] = [];
  const anim = currentAnimation ?? null;

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = board[row][col];
      if (cell === EMPTY) {
        continue;
      }
      const type = cell.includes("beagle") ? "beagle" : "corgi";
      const isKing = cell.includes("-king");
      const isAnimating =
        anim !== null &&
        anim.fromRow === row &&
        anim.fromCol === col;

      out.push({
        key: `piece-${row}-${col}`,
        boardRow: row,
        boardCol: col,
        type,
        isKing,
        pointerTarget: pieceUtils.isPlayerPiece(cell),
        animationId: isAnimating ? anim.animationId : null,
      });
    }
  }

  return out;
}
```

- [ ] **Step 3: `Board3DContent`** — замените `useMemo` с `flatMap` на:

```ts
const pieceDescriptors = useMemo(
  () => buildPieceDescriptors(board, selectedPiece, currentAnimation ?? null),
  [board, selectedPiece, currentAnimation]
);
```

И рендер:

```tsx
{pieceDescriptors.map((d) => (
  <PieceMesh
    key={d.key}
    type={d.type}
    isKing={d.isKing}
    boardRow={d.boardRow}
    boardCol={d.boardCol}
    onClick={() => onPieceSelect(d.boardRow, d.boardCol)}
    isSelected={
      selectedPiece?.row === d.boardRow && selectedPiece?.col === d.boardCol
    }
    gameMode={gameMode}
    animationId={d.animationId}
    pointerTarget={d.pointerTarget}
  />
))}
```

- [ ] **Step 4: Тесты + typecheck + commit**

Run: `npm run test -- src/components/Board3D/buildPieceDescriptors.test.ts`

```bash
git add src/components/Board3D/buildPieceDescriptors.ts src/components/Board3D/buildPieceDescriptors.test.ts src/components/Board3D/Board3D.tsx
git commit -m "refactor(board3d): build piece render list in pure function"
```

---

### Task 7: `PieceMesh` — только UI, правила в пропсе

**Files:**

- Modify: `src/components/Board3D/PieceMesh.tsx`

- [ ] **Step 1: Добавить проп**

```ts
pointerTarget: boolean;
```

- [ ] **Step 2: Заменить условия**

В `handleClick` и `onPointerOver`: вместо `type === "beagle"` используйте `pointerTarget` (и по желанию оставьте `type === "beagle"` только для визуального hover scale, если это чисто косметика для стороны игрока — либо вынесите в проп `emphasizeOnHover` для полного разделения; минимальный объём: клик только при `pointerTarget`).

Пример минимального изменения:

```ts
if (!pointerTarget) {
  return;
}
onClick();
```

И для hover на невидимом меша: `if (pointerTarget && !isMoving) setHovered(true)`.

- [ ] **Step 3: `npm run typecheck`**

- [ ] **Step 4: Commit**

```bash
git add src/components/Board3D/PieceMesh.tsx
git commit -m "refactor(board3d): delegate piece click policy to pointerTarget prop"
```

---

### Task 8: Хук `useGameBoardController` + презентационные компоненты

**Files:**

- Create: `src/hooks/useGameBoardController.ts`
- Create: `src/components/GameBoardHud.tsx`
- Create: `src/components/GameOverSheet.tsx`
- Modify: `src/components/GameBoard.tsx`

- [ ] **Step 1: Интерфейс возврата хука** (перенесите из `GameBoard.tsx` без изменения поведения):

Публичный API хука должен включать как минимум:

- `piecesWithCaptures`
- `handlePerformanceData`
- `handlePieceSelect`
- `handleNewGame`
- `handleReturnToMenu`
- `performanceMode`, `currentFps`, `showFpsInfo`, `setShowFpsInfo`
- `perfDotClass`, `hudBtnClass` **или** перенесите классы в `GameBoardHud` как константы модуля, а хук оставьте без CSS.

Реализацию `handleNewGame` постройте на `restartMatch` из store + `useTransientActionLock(1000)` вместо `boardCreationRef`.

Подключите `useBotAI({ setCurrentAnimation })` внутри хука.

- [ ] **Step 2: `GameBoardHud.tsx`** — принимает пропсы:

```ts
export interface GameBoardHudProps {
  gameMessage: string;
  showFpsInfo: boolean;
  onToggleFps: () => void;
  currentFps: number;
  perfDotClass: string;
  hudBtnClass: string;
  onOpenRules: () => void;
  onOpenModeSelector: () => void;
  onReturnToMenu: () => void;
  playerTurn: boolean;
  gameOver: boolean;
  selectedPiece: { row: number; col: number } | null;
}
```

Скопируйте JSX из текущего блока `pointer-events-none` верхней/нижней панели `GameBoard.tsx` (строки с контейнером HUD — см. актуальный файл).

- [ ] **Step 3: `GameOverSheet.tsx`** — пропсы:

```ts
export interface GameOverSheetProps {
  title: string;
  onNewGame: () => void;
  onReturnToMenu: () => void;
}
```

Скопируйте разметку `gameOver && (...)` из `GameBoard`.

- [ ] **Step 4: `GameBoard.tsx`** станет похожим на:

```tsx
export function GameBoard({ onReturnToMenu }: GameBoardProps) {
  const ctrl = useGameBoardController({ onReturnToMenu });
  const [showRules, setShowRules] = useState(false);
  const [modeSelectorOpen, setModeSelectorOpen] = useState(false);

  return (
    <div id="chess-board-container" className="...">
      <div className="absolute inset-0 z-0">
        <Board3D
          board={ctrl.board}
          onPieceSelect={ctrl.handlePieceSelect}
          ...
        />
      </div>
      <GameBoardHud
        gameMessage={ctrl.gameMessage}
        ...
        onOpenRules={() => setShowRules(true)}
        onOpenModeSelector={() => setModeSelectorOpen(true)}
        onReturnToMenu={ctrl.handleReturnToMenu}
      />
      {ctrl.gameOver && (
        <GameOverSheet
          title={ctrl.gameMessage}
          onNewGame={ctrl.handleNewGame}
          onReturnToMenu={ctrl.handleReturnToMenu}
        />
      )}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      {modeSelectorOpen && (
        <ModeSelector onClose={() => setModeSelectorOpen(false)} />
      )}
    </div>
  );
}
```

Точные поля возьмите из фактического хука после переноса.

- [ ] **Step 5: Ручная проверка**

Run: `npm run dev`

Проверьте: выбор фигуры, ход, множественное взятие, конец партии, «Новая игра» с cooldown, смена режима из HUD, возврат в меню.

- [ ] **Step 6: `npm run typecheck` && `npm run lint`**

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useGameBoardController.ts src/components/GameBoardHud.tsx src/components/GameOverSheet.tsx src/components/GameBoard.tsx
git commit -m "refactor(gameboard): split controller hook and HUD overlays"
```

---

## Self-review (выполнено при составлении плана)

**1. Spec coverage:** Каждая проблемная зона из аудита покрыта: `GameBoard`, дублирование старта партии (`MainMenu` / `ModeSelector` / `GameControls` / рестарт в игре), `useBoardSquares`, `PieceMesh`, толстый маппинг `Board3D`, тип для `useBotAI`.

**2. Placeholder scan:** Нет TBD/TODO; шаги с кодом содержат фрагменты реализации или чёткие указания «скопировать из текущего файла».

**3. Type consistency:** `PieceAnimationInfo` единый в `@shared/types/pieceAnimation.types`; дескрипторы используют `Board` и `pieceUtils.isPlayerPiece` согласованно с прежней логикой клика по биглю.

---

## Execution handoff

**План сохранён в** `docs/superpowers/plans/2026-04-10-separate-ui-from-game-logic.md`.

**Два варианта выполнения:**

1. **Subagent-Driven (рекомендуется)** — отдельный субагент на каждую задачу, ревью между задачами; обязателен субскилл superpowers:subagent-driven-development.

2. **Inline execution** — выполнение задач в этой сессии пакетами с чекпоинтами; субскилл superpowers:executing-plans.

Какой вариант выбираете?
