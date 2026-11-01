import { create } from "zustand";

export const MOVE_DURATION_MS = 350;
export const CAPTURE_DURATION_MS = 450;
const SAFETY_TIMEOUT_MS = 1500;

export interface ActiveMove {
  id: string;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  isCapture: boolean;
  startTime: number;
  duration: number;
}

interface AnimationStore {
  activeMove: ActiveMove | null;
  isAnimating: boolean;
  animateMove: (
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
    isCapture: boolean
  ) => Promise<boolean>;
  completeAnimation: (id: string) => void;
  clearAllAnimations: () => void;
}

const resolvers = new Map<string, (completed: boolean) => void>();
const safetyTimers = new Map<string, ReturnType<typeof setTimeout>>();
let nextId = 1;

const settle = (id: string, completed: boolean) => {
  clearTimeout(safetyTimers.get(id));
  safetyTimers.delete(id);
  const resolve = resolvers.get(id);
  resolvers.delete(id);
  resolve?.(completed);
};

export const useAnimationStore = create<AnimationStore>((set, get) => ({
  activeMove: null,
  isAnimating: false,

  animateMove: (fromRow, fromCol, toRow, toCol, isCapture) => {
    const previous = get().activeMove;
    if (previous) {
      settle(previous.id, false);
    }
    const id = `move-${nextId++}`;
    const duration = isCapture ? CAPTURE_DURATION_MS : MOVE_DURATION_MS;
    const done = new Promise<boolean>((resolve) => {
      resolvers.set(id, resolve);
    });
    safetyTimers.set(
      id,
      setTimeout(
        () => get().completeAnimation(id),
        duration + SAFETY_TIMEOUT_MS
      )
    );
    set({
      isAnimating: true,
      activeMove: {
        id,
        fromRow,
        fromCol,
        toRow,
        toCol,
        isCapture,
        startTime: performance.now(),
        duration,
      },
    });
    return done;
  },

  completeAnimation: (id) => {
    if (get().activeMove?.id !== id) {
      return;
    }
    set({ activeMove: null, isAnimating: false });
    settle(id, true);
  },

  clearAllAnimations: () => {
    const active = get().activeMove;
    set({ activeMove: null, isAnimating: false });
    if (active) {
      settle(active.id, false);
    }
  },
}));
