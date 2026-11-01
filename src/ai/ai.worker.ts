import { computeBotMove, type BotMoveRequest } from "./botMove";

export interface WorkerRequest extends BotMoveRequest {
  id: number;
}

export type WorkerResponse =
  | { id: number; move: ReturnType<typeof computeBotMove> }
  | { id: number; error: string };

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage: (message: WorkerResponse) => void;
};

scope.onmessage = (event) => {
  const { id, ...request } = event.data;
  try {
    scope.postMessage({ id, move: computeBotMove(request) });
  } catch (error) {
    scope.postMessage({
      id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
