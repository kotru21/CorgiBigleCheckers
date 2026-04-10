# Modes & Move Rules Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Согласовать игровой режим `GameMode` с правилами ходов (режим «Безумные прыжки»), ИИ, проверкой окончания партии и текстами HUD; подключить смену режима из игры; убрать или задействовать мёртвый код из ревью.

**Architecture:** Правило «длинные прыжки» для простых фишек реализуется в `findRegularCaptures`: после обнаружения соседнего врага перебираются все пустые тёмные клетки по диагонали за врагом до препятствия. Во все публичные функции генерации ходов добавляется необязательный последний аргумент `gameMode` со значением по умолчанию `classic` (обратная совместимость для вызовов без режима). Минимакс и транспозиционная таблица включают `gameMode` в ключ кэша. UI: `ModeSelector` открывается из HUD `GameBoard`; сообщения хода игрока — через новый хелпер в `modeHelpers`.

**Tech Stack:** React 19, TypeScript, Vite, Zustand, Vitest (добавляется), существующие алиасы `@shared/*`.

**Контекст:** Желательно выполнять в отдельном git worktree (навык brainstorming/using-git-worktrees); в основной ветке допустимо при соблюдении частых коммитов.

---

## Файлы: карта изменений

| Файл | Ответственность |
|------|-----------------|
| `package.json` | Скрипт `test`, devDependency `vitest` |
| `vitest.config.ts` (создать) | Алиас `@shared`, среда `node` |
| `tsconfig.json` | При необходимости `include` для `vitest.config.ts` (опционально) |
| `src/services/move/helpers.ts` | Параметр `longMenCaptures` в `findRegularCaptures` + логика нескольких клеток приземления |
| `src/services/move/captures.ts` | Проброс флага в `findRegularCaptures` |
| `src/services/move/validMoves.ts` | Проброс в `getAllPossibleCaptures` |
| `src/services/move/capturePriority.ts` | `gameMode` в `hasCaptures`, `getPiecesWithCaptures`, `getValidMovesWithCapturePriority` |
| `src/utils/modeHelpers.ts` | `isCrazyJumpsMode(mode)`, `getPlayerTurnPromptMessage(mode)` |
| `src/services/BoardService.ts` | `checkGameStatus(board, gameMode?)` |
| `src/services/ai/getMoves.ts` | `getAllBotMoves(board, gameMode?)`, `getAllPlayerMoves(board, gameMode?)` |
| `src/services/ai/minimax.ts` | `gameMode` в `minimaxAlphaBeta`, ключ TT, `getBestMove` |
| `src/services/ai/index.ts` | Реэкспорт сигнатур (если меняется) |
| `src/hooks/useBotAI.ts` | Передача `gameMode` в `getBestMove` и все `getValidMovesWithCapturePriority`; сообщение после хода |
| `src/components/GameBoard.tsx` | Все вызовы ходов с `gameMode`; `useMemo` для `piecesWithCaptures`; `ModeSelector`; убрать `as GameMode` |
| `src/components/Board3D/components/PerformanceMonitor.tsx` | Пороги FPS из `GAME_CONFIG` |
| `src/shared/config/constants.ts` | Числовые пороги FPS, согласованные с текущим поведением (20 / 40) |
| `src/shared/types/game.types.ts` | Удалить неиспользуемый `interface GameState` |
| `src/shared/config/constants.ts` | Удалить неиспользуемый `GAME_STATES` (если после grep нет ссылок) |
| `src/components/GameHeader.tsx` | Удалить файл (не подключён, стиль не совпадает с HUD) |

---

### Task 1: Подключить Vitest

**Files:**
- Modify: `d:\GitRepositories\CorgiBigleCheckers\package.json`
- Create: `d:\GitRepositories\CorgiBigleCheckers\vitest.config.ts`

- [ ] **Step 1: Установить зависимость**

```bash
cd d:\GitRepositories\CorgiBigleCheckers
npm install -D vitest@^3.2.0
```

- [ ] **Step 2: Добавить скрипт `test` в `package.json`**

В секции `"scripts"` добавить:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Создать `vitest.config.ts`**

```typescript
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "src/shared"),
    },
  },
});
```

- [ ] **Step 4: Запустить тесты (пока 0 файлов)**

Run: `npm run test`  
Expected: вывод Vitest без тестов или `No test files found` — не ошибка.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest for move-rule unit tests"
```

---

### Task 2: Пороги FPS из конфига

**Files:**
- Modify: `d:\GitRepositories\CorgiBigleCheckers\src\shared\config\constants.ts`
- Modify: `d:\GitRepositories\CorgiBigleCheckers\src\components\Board3D\components\PerformanceMonitor.tsx`

- [ ] **Step 1: Заменить блок `PERFORMANCE` в `constants.ts`**

Найти `GAME_CONFIG.PERFORMANCE` и привести к явным порогам, совпадающим с текущей логикой монитора (ниже 20 → low, ниже 40 → medium):

```typescript
PERFORMANCE: {
  CACHE_SIZE_LIMIT: 1000,
  FPS_TARGET: 60,
  FPS_WARNING_THRESHOLD: 30,
  FPS_CRITICAL_THRESHOLD: 15,
  /** Ниже этого FPS включается режим medium (если ≥ FPS_LOW_THRESHOLD). */
  FPS_MEDIUM_BAND: 40,
  /** Ниже этого FPS включается режим low. */
  FPS_LOW_BAND: 20,
},
```

- [ ] **Step 2: Использовать константы в `PerformanceMonitor.tsx`**

В начале файла:

```typescript
import { GAME_CONFIG } from "@shared/config/constants";
```

Внутри `useFrame`, заменить литералы:

```typescript
const { FPS_MEDIUM_BAND, FPS_LOW_BAND } = GAME_CONFIG.PERFORMANCE;
// ...
if (fps.current < FPS_LOW_BAND) {
  newMode = "low";
} else if (fps.current < FPS_MEDIUM_BAND) {
  newMode = "medium";
}
```

- [ ] **Step 3: Проверка типов и линт**

Run: `npm run typecheck`  
Expected: без ошибок.

Run: `npm run lint`  
Expected: без новых ошибок.

- [ ] **Step 4: Commit**

```bash
git add src/shared/config/constants.ts src/components/Board3D/components/PerformanceMonitor.tsx
git commit -m "refactor: tie performance monitor FPS bands to GAME_CONFIG"
```

---

### Task 3: Хелперы режима и сообщение хода игрока

**Files:**
- Modify: `d:\GitRepositories\CorgiBigleCheckers\src\utils\modeHelpers.ts`

- [ ] **Step 1: Добавить функции в правильном порядке**

1. Сразу после импортов, **перед** `getModeName`, вставить:

```typescript
export const isCrazyJumpsMode = (mode: GameMode): boolean =>
  mode === GAME_MODES.CRAZY_JUMPS;
```

2. **После** всего блока с `getModeNameShort` (после закрывающей `};` этой функции), добавить:

```typescript
/** Сообщение, когда снова ход игрока после хода бота. */
export const getPlayerTurnPromptMessage = (mode: GameMode): string =>
  `${getModeNameShort(mode)} · выберите фигуру`;
```

Файл должен заканчиваться цепочкой: `getModeStartMessage` без изменений (он уже после `getModeNameShort`).

- [ ] **Step 2: Commit**

```bash
git add src/utils/modeHelpers.ts
git commit -m "feat: add crazy-jumps mode check and player turn prompt helper"
```

---

### Task 4: Длинные прыжки простой фишки — тест (падает до реализации)

**Files:**
- Create: `d:\GitRepositories\CorgiBigleCheckers\src\services\move\helpers.crazyJumps.test.ts`

- [ ] **Step 1: Написать падающий тест**

Используется прямой вызов `findRegularCaptures` с резолвером без продолжений.

```typescript
import { describe, it, expect } from "vitest";
import { PLAYER, BOT, EMPTY } from "@shared/config/constants";
import type { Board } from "@shared/types/game.types";
import { findRegularCaptures } from "./helpers";

const emptyBoard = (): Board =>
  Array.from({ length: 10 }, () => Array(10).fill(EMPTY)) as Board;

describe("findRegularCaptures long men (crazy jumps)", () => {
  it("offers multiple landing squares past a captured man", () => {
    const board = emptyBoard();
    // Игрок (beagle) внизу, ход вверх-влево: соседняя диагональ — корги.
    const playerRow = 6;
    const playerCol = 4;
    const enemyRow = 5;
    const enemyCol = 3;
    board[playerRow][playerCol] = PLAYER;
    board[enemyRow][enemyCol] = BOT;
    // Тёмные клетки: убедиться, что (4,2) и (3,1) пусты и тёмные — подправить координаты под isDarkSquare проекта.
    const rowDir = -1;
    const colDir = -1;

    const noopResolver = () => [] as ReturnType<typeof findRegularCaptures>;

    const classic = findRegularCaptures(
      board,
      playerRow,
      playerCol,
      rowDir,
      colDir,
      PLAYER,
      true,
      new Set(),
      noopResolver,
      { longMenCaptures: false }
    );
    const crazy = findRegularCaptures(
      board,
      playerRow,
      playerCol,
      rowDir,
      colDir,
      PLAYER,
      true,
      new Set(),
      noopResolver,
      { longMenCaptures: true }
    );

    expect(classic.length).toBe(1);
    expect(crazy.length).toBeGreaterThan(1);
  });
});
```

**Важно:** Перед запуском скорректировать координаты `playerRow/playerCol/enemyRow/enemyCol` и направление так, чтобы `boardUtils.isDarkSquare` был true для всех задействованных клеток (свериться с `src/utils/gameHelpers.ts` и при необходимости вывести `isDarkSquare` для пары клеток в одноразовом логе или временном `console` в тесте). Цель теста: при `longMenCaptures: true` строго больше вариантов, чем при `false`.

- [ ] **Step 2: Запустить тест — ожидание FAIL**

Run: `npm run test -- src/services/move/helpers.crazyJumps.test.ts`  
Expected: ошибка компиляции или теста (нет опции `longMenCaptures` или `crazy.length` не больше 1).

- [ ] **Step 3: Commit**

```bash
git add src/services/move/helpers.crazyJumps.test.ts
git commit -m "test: expect multiple landings for crazy-jumps men captures"
```

---

### Task 5: Реализовать `longMenCaptures` в `findRegularCaptures`

**Files:**
- Modify: `d:\GitRepositories\CorgiBigleCheckers\src\services\move\helpers.ts`

- [ ] **Step 1: Расширить сигнатуру**

Добавить в конец параметров (после `resolveCaptures`):

```typescript
options?: { longMenCaptures?: boolean }
```

Внутри функции:

```typescript
const longMenCaptures = options?.longMenCaptures === true;
```

- [ ] **Step 2: Заменить тело ветки успешного одиночного прыжка**

После проверки `isEnemyPiece` и что клетка за врагом для классики пуста — вместо одного `jumpRow/jumpCol` собрать массив пар.

Полный референс-реализация (заменить соответствующий блок в `findRegularCaptures`):

```typescript
  if (isEnemyPiece(cellPiece, isPlayer)) {
    const enemyR = newRow;
    const enemyC = newCol;

    const landingSquares: Array<{ jumpRow: number; jumpCol: number }> = [];

    if (longMenCaptures) {
      let distance = 1;
      while (true) {
        const jumpRow = enemyR + rowDir * distance;
        const jumpCol = enemyC + colDir * distance;

        if (!boardUtils.isValidSquare(jumpRow, jumpCol)) {
          break;
        }
        if (!boardUtils.isDarkSquare(jumpRow, jumpCol)) {
          distance++;
          continue;
        }
        if (board[jumpRow][jumpCol] === EMPTY) {
          landingSquares.push({ jumpRow, jumpCol });
          distance++;
        } else {
          break;
        }
      }
    } else {
      const jumpRow = enemyR + rowDir;
      const jumpCol = enemyC + colDir;
      if (
        boardUtils.isValidSquare(jumpRow, jumpCol) &&
        board[jumpRow][jumpCol] === EMPTY
      ) {
        landingSquares.push({ jumpRow, jumpCol });
      }
    }

    for (const { jumpRow, jumpCol } of landingSquares) {
      const tempBoard = createTempBoard(
        board,
        row,
        col,
        jumpRow,
        jumpCol,
        enemyR,
        enemyC
      );
      const continuedCaptures = resolveCaptures(
        tempBoard,
        jumpRow,
        jumpCol,
        new Set(visited)
      );

      captures.push(
        createCaptureMove(jumpRow, jumpCol, enemyR, enemyC, continuedCaptures)
      );
    }
  }
```

Удалить старый дублирующий блок с одним `jumpRow/jumpCol`, чтобы не было двойного push.

- [ ] **Step 3: Запустить тест**

Run: `npm run test -- src/services/move/helpers.crazyJumps.test.ts`  
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/services/move/helpers.ts
git commit -m "feat(move): optional long landing squares for men captures"
```

---

### Task 6: Проброс `longMenCaptures` через цепочку захватов

**Files:**
- Modify: `d:\GitRepositories\CorgiBigleCheckers\src\services\move\captures.ts`
- Modify: `d:\GitRepositories\CorgiBigleCheckers\src\services\move\validMoves.ts`
- Modify: `d:\GitRepositories\CorgiBigleCheckers\src\services\move\capturePriority.ts`

- [ ] **Step 1: `getAllPossibleCaptures`**

Добавить параметр `longMenCaptures = false` (или объект опций) и передать в `findRegularCaptures(..., { longMenCaptures })`.

Рекурсивный `resolver` должен вызывать `getAllPossibleCaptures` с тем же флагом.

- [ ] **Step 2: `getValidMoves`**

Сигнатура: `getValidMoves(board, row, col, longMenCaptures?: boolean)` — передавать в `getAllPossibleCaptures`.

- [ ] **Step 3: `capturePriority.ts`**

Импорт:

```typescript
import type { GameMode } from "@shared/types/game.types";
import { isCrazyJumpsMode } from "../../utils/modeHelpers";
```

Ввести вспомогательную функцию в начале файла:

```typescript
const longMenForMode = (gameMode?: GameMode): boolean =>
  gameMode !== undefined && isCrazyJumpsMode(gameMode);
```

Обновить:

- `hasCaptures(board, isPlayer, gameMode?)` — все вызовы `getAllPossibleCaptures(..., visited)` передают `longMenForMode(gameMode)`.
- `getPiecesWithCaptures(board, isPlayer, gameMode?)` — аналогично.
- `getValidMovesWithCapturePriority(board, row, col, gameMode?)` — передавать `gameMode` в `hasCaptures`, `getPiecesWithCaptures`, `getAllPossibleCaptures`, `getValidMoves`.

Сигнатура публичной функции:

```typescript
export const getValidMovesWithCapturePriority = (
  board: Board,
  row: number,
  col: number,
  gameMode?: GameMode
) => {
  const longMen = longMenForMode(gameMode);
  // ...
};
```

- [ ] **Step 4: Тесты и типcheck**

Run: `npm run test`  
Run: `npm run typecheck`  
Expected: PASS / без ошибок (возможны ошибки в других файлах до Task 7 — тогда временно не вызывать `tsc` до обновления вызовов).

- [ ] **Step 5: Commit**

```bash
git add src/services/move/captures.ts src/services/move/validMoves.ts src/services/move/capturePriority.ts
git commit -m "feat(move): thread crazy-jumps flag through capture generation"
```

---

### Task 7: BoardService и AI с учётом `gameMode`

**Files:**
- Modify: `d:\GitRepositories\CorgiBigleCheckers\src\services\BoardService.ts`
- Modify: `d:\GitRepositories\CorgiBigleCheckers\src\services\ai\getMoves.ts`
- Modify: `d:\GitRepositories\CorgiBigleCheckers\src\services\ai\minimax.ts`

- [ ] **Step 1: `checkGameStatus`**

```typescript
import type { GameMode } from "@shared/types/game.types";

export const checkGameStatus = (
  board: Board,
  gameMode?: GameMode
): PlayerType | null => {
```

Все вызовы `getValidMovesWithCapturePriority(board, row, col)` заменить на `getValidMovesWithCapturePriority(board, row, col, gameMode)`.

- [ ] **Step 2: `getMoves.ts`**

```typescript
import type { GameMode } from "@shared/types/game.types";

export const getAllBotMoves = (board: Board, gameMode?: GameMode) => {
  // ...
  getValidMovesWithCapturePriority(board, row, col, gameMode);
};

export const getAllPlayerMoves = (board: Board, gameMode?: GameMode) => {
  // ...
};
```

- [ ] **Step 3: `minimax.ts`**

Добавить параметр `gameMode?: GameMode` в `minimaxAlphaBeta` и `getBestMove`.

Заменить ключ кэша:

```typescript
const cacheKey = `${boardKey}-${depth}-${isMaximizing}-${gameMode ?? "classic"}`;
```

Вызовы:

```typescript
const moves = isMaximizing
  ? getAllBotMoves(board, gameMode)
  : getAllPlayerMoves(board, gameMode);
```

Рекурсивные вызовы `minimaxAlphaBeta` передают тот же `gameMode`.

`getBestMove`:

```typescript
export const getBestMove = (
  board: Board,
  depth: number,
  gameMode?: GameMode
): SearchMove | null => {
  // ...
  const result = minimaxAlphaBeta(
    board,
    depth,
    -Infinity,
    Infinity,
    true,
    gameMode
  );
```

- [ ] **Step 4: Проверка**

Run: `npm run typecheck`  
Expected: могут остаться ошибки в `useBotAI` / `GameBoard` — исправить в Task 8.

- [ ] **Step 5: Commit**

```bash
git add src/services/BoardService.ts src/services/ai/getMoves.ts src/services/ai/minimax.ts
git commit -m "feat(ai): respect game mode in move generation and minimax cache"
```

---

### Task 8: UI и бот — передать `gameMode` везде

**Files:**
- Modify: `d:\GitRepositories\CorgiBigleCheckers\src\hooks\useBotAI.ts`
- Modify: `d:\GitRepositories\CorgiBigleCheckers\src\components\GameBoard.tsx`

- [ ] **Step 1: `useBotAI`**

Импорт:

```typescript
import { getPlayerTurnPromptMessage } from "../utils/modeHelpers";
```

Заменить:

```typescript
const bestMove = getBestMove(currentBoard as Board, depth, gameMode);
```

Все `getValidMovesWithCapturePriority(workingBoard, targetRow, targetCol)` → добавить `gameMode`.

После хода бота:

```typescript
setGameMessage(getPlayerTurnPromptMessage(gameMode));
```

Перед `checkGameStatus`:

```typescript
const gameStatus = checkGameStatus(workingBoard, gameMode);
```

- [ ] **Step 2: `GameBoard`**

Импорты:

```typescript
import { ModeSelector } from "./ModeSelector";
import { getModeStartMessage, getPlayerTurnPromptMessage } from "../utils/modeHelpers";
```

State: `const [modeSelectorOpen, setModeSelectorOpen] = useState(false);`

`useMemo` для `piecesWithCaptures`:

```typescript
return getPiecesWithCaptures(board, true, gameMode);
```

Зависимости: `[board, playerTurn, gameMode]`.

Все вызовы:

- `getValidMovesWithCapturePriority(...)` → добавить `gameMode` (в `selectPiece`, в колбэке после хода, любые другие).

После хода игрока:

```typescript
const gameStatus = checkGameStatus(newBoard, gameMode);
```

`handleNewGame`: после сброса поля:

```typescript
setGameMessage(getModeStartMessage(gameMode));
```

Убрать `gameMode as GameMode` у `Board3D`: передавать `gameMode` напрямую (тип уже из store).

Кнопка в HUD (рядом с «?» и «Меню»), те же классы что у соседних кнопок:

```tsx
<button
  type="button"
  onClick={() => setModeSelectorOpen(true)}
  className={hudBtnClass}
  title="Сменить режим">
  Режим
</button>
```

В конце JSX (рядом с `RulesModal`):

```tsx
{modeSelectorOpen && (
  <ModeSelector onClose={() => setModeSelectorOpen(false)} />
)}
```

Сообщение «Ход корги...» можно оставить или сделать нейтральным — по желанию; обязательное — согласованность с Task 3 для хода игрока после бота.

- [ ] **Step 3: Проверка**

Run: `npm run typecheck`  
Run: `npm run lint`  
Run: `npm run test`  
Run: `npm run build`  
Expected: все успешно.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useBotAI.ts src/components/GameBoard.tsx
git commit -m "feat(ui): wire game mode through board, bot, and mode selector"
```

---

### Task 9: Удалить мёртвые экспорты и `GameHeader`

**Files:**
- Modify: `d:\GitRepositories\CorgiBigleCheckers\src\shared\types\game.types.ts`
- Modify: `d:\GitRepositories\CorgiBigleCheckers\src\shared\config\constants.ts`
- Delete: `d:\GitRepositories\CorgiBigleCheckers\src\components\GameHeader.tsx`

- [ ] **Step 1: Удалить `interface GameState`** из `game.types.ts` целиком (строки 33–42, от `export interface GameState` до закрывающей `}` перед `MinimaxResult`).

- [ ] **Step 2: Удалить `GAME_STATES`** из `constants.ts` целиком.

- [ ] **Step 3: Удалить `GameHeader.tsx`**

Перед удалением убедиться: `grep -r GameHeader src` пусто.

- [ ] **Step 4: Проверка**

Run: `npm run typecheck` && `npm run lint` && `npm run build`  
Expected: успех.

- [ ] **Step 5: Commit**

```bash
git add -A src/shared/types/game.types.ts src/shared/config/constants.ts
git rm src/components/GameHeader.tsx
git commit -m "chore: remove unused game state types and orphaned GameHeader"
```

---

## Self-review (выполнено автором плана)

**1. Spec coverage:** Режим «Безумные прыжки» (правила) — Tasks 4–6–7–8. Сообщения HUD / новая игра — Task 3, 8. Смена режима в игре — Task 8. FPS-константы — Task 2. Мёртвый код — Task 9.  
**2. Placeholder scan:** Нет TBD; координаты в Task 4 помечены как требующие сверки с `isDarkSquare` — исполнитель обязан поправить до зелёного теста.  
**3. Type consistency:** Везде используется `GameMode` из `@shared/types/game.types`; опциональный `gameMode?` согласован с дефолтом «классика» через отсутствие флага longMen.

---

**План сохранён в `docs/superpowers/plans/2026-04-10-modes-fixes.md`. Два варианта исполнения:**

**1. Subagent-Driven (рекомендуется)** — отдельный субагент на каждую задачу, ревью между задачами.

**2. Inline Execution** — выполнение задач в этой сессии пакетами с чекпоинтами.

**Какой вариант выбираете?**
