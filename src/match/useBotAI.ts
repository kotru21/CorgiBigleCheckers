import { useEffect } from "react";
import { BOT_TIMING, GAME_MODES } from "@/shared/config/constants";
import { logger } from "@/shared/logger";
import { getBotClient } from "@/ai/botClient";
import { useAnimationStore } from "./animationStore";
import { useGameStore } from "./gameStore";
import { botSideOf } from "./settings";
import { runBotTurn } from "./turnRunner";

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export function useBotAI() {
  const revision = useGameStore((s) => s.revision);

  useEffect(() => {
    const store = useGameStore.getState;
    const state = store();
    const side = botSideOf(state.settings);
    if (side === null || state.turn !== side || state.result) {
      return;
    }

    let cancelled = false;
    const isCurrent = () => !cancelled && store().revision === revision;
    const request = {
      board: state.board,
      side,
      rules: state.rules,
      level: state.settings.puzzleId ? "hard" : state.difficulty,
      history: {
        positionCounts: state.draw.positionCounts,
        kingMovePlies: state.draw.kingMovePlies,
      },
    } as const;

    runBotTurn({
      board: state.board,
      isCurrent,
      think: () => getBotClient().requestMove(request),
      wait,
      thinkDelayMs:
        state.settings.mode === GAME_MODES.TURBO
          ? BOT_TIMING.TURBO_THINK_DELAY_MS
          : BOT_TIMING.THINK_DELAY_MS,
      animateLeg: (from, to, isCapture) =>
        useAnimationStore
          .getState()
          .animateMove(from.row, from.col, to.row, to.col, isCapture),
      showBoard: (shown) => store().setDisplayBoard(shown),
      commit: (move) => {
        store().commitMove(move);
      },
    })
      .then((outcome) => {
        if (outcome === "no-move") {
          logger.error("ИИ не вернул ход в позиции, где ходы есть");
          store().setGameMessage("Бот не смог сходить. Начните новую партию.");
        }
      })
      .catch((error: unknown) => {
        if (!isCurrent()) {
          return;
        }
        logger.error("Ошибка при ходе бота:", error);
        store().setDisplayBoard(null);
        store().setGameMessage("Ошибка хода бота. Начните новую партию.");
      });

    return () => {
      cancelled = true;
    };
  }, [revision]);
}
