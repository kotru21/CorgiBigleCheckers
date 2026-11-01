import type { PieceMove } from "@/shared/types/game.types";
import { logger } from "@/shared/logger";
import { computeBotMove, type BotMoveRequest } from "./botMove";
import type { WorkerRequest, WorkerResponse } from "./ai.worker";

export interface BotClient {
  requestMove: (request: BotMoveRequest) => Promise<PieceMove | null>;
  dispose: () => void;
}

interface Pending {
  request: BotMoveRequest;
  resolve: (move: PieceMove | null) => void;
  reject: (error: Error) => void;
}

const computeLater = (request: BotMoveRequest) =>
  new Promise<PieceMove | null>((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(computeBotMove(request));
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    }, 0);
  });

export function createBotClient(): BotClient {
  const pending = new Map<number, Pending>();
  let nextId = 1;
  let worker: Worker | null = null;

  const fallBack = (reason: unknown) => {
    logger.warn("ИИ-воркер недоступен, считаем ход в основном потоке:", reason);
    worker?.terminate();
    worker = null;
    for (const { request, resolve, reject } of pending.values()) {
      computeLater(request).then(resolve, reject);
    }
    pending.clear();
  };

  if (typeof Worker !== "undefined") {
    try {
      worker = new Worker(new URL("./ai.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const entry = pending.get(event.data.id);
        if (!entry) {
          return;
        }
        pending.delete(event.data.id);
        if ("error" in event.data) {
          entry.reject(new Error(event.data.error));
        } else {
          entry.resolve(event.data.move);
        }
      };
      worker.onerror = (event) => {
        event.preventDefault();
        fallBack(event.message);
      };
    } catch (error) {
      fallBack(error);
    }
  }

  return {
    requestMove: (request) => {
      if (!worker) {
        return computeLater(request);
      }
      const id = nextId++;
      const message: WorkerRequest = { id, ...request };
      return new Promise((resolve, reject) => {
        pending.set(id, { request, resolve, reject });
        worker?.postMessage(message);
      });
    },
    dispose: () => {
      worker?.terminate();
      worker = null;
      for (const { resolve } of pending.values()) {
        resolve(null);
      }
      pending.clear();
    },
  };
}

let shared: BotClient | null = null;

export const getBotClient = (): BotClient => {
  shared ??= createBotClient();
  return shared;
};
