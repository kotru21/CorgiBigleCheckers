import { create } from "zustand";
import type { AnimatingPiece, AnimationConfig } from "../types";
import { generateAnimationId, boardToWorld } from "../lib/interpolation";

export const ANIMATION_CONFIG: AnimationConfig = {
  moveDuration: 350,
  captureDuration: 450,
  jumpHeight: 0.8,
  selectionHeight: 0.3,
  hoverHeight: 0.15,
  smoothSpeed: 12,
} as const;

export const ANIMATION_CONFIG_LEGACY = {
  MOVE_DURATION: ANIMATION_CONFIG.moveDuration,
  CAPTURE_DURATION: ANIMATION_CONFIG.captureDuration,
  JUMP_HEIGHT: ANIMATION_CONFIG.jumpHeight,
  SELECTION_HEIGHT: ANIMATION_CONFIG.selectionHeight,
  HOVER_HEIGHT: ANIMATION_CONFIG.hoverHeight,
} as const;

interface AnimationStore {
  animatingPieces: Map<string, AnimatingPiece>;
  isAnimating: boolean;
  pendingBoardUpdate: (() => void) | null;

  startAnimation: (
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
    isCapture: boolean,
    onComplete?: () => void
  ) => string;

  completeAnimation: (id: string) => void;
  getAnimatingPiece: (id: string) => AnimatingPiece | undefined;
  isPositionAnimating: (row: number, col: number) => boolean;
  clearAllAnimations: () => void;
  setPendingBoardUpdate: (callback: (() => void) | null) => void;
  executePendingUpdate: () => void;
}

export const useAnimationStore = create<AnimationStore>((set, get) => ({
  animatingPieces: new Map(),
  isAnimating: false,
  pendingBoardUpdate: null,

  startAnimation: (fromRow, fromCol, toRow, toCol, isCapture, onComplete) => {
    const id = generateAnimationId(fromRow, fromCol);
    const from = boardToWorld(fromRow, fromCol);
    const to = boardToWorld(toRow, toCol);
    const duration = isCapture
      ? ANIMATION_CONFIG.captureDuration
      : ANIMATION_CONFIG.moveDuration;

    const animatingPiece: AnimatingPiece = {
      id,
      from,
      to,
      startTime: performance.now(),
      duration,
      isCapture,
    };

    const callback = onComplete;

    set((state) => {
      const newMap = new Map(state.animatingPieces);
      newMap.set(id, animatingPiece);
      return {
        animatingPieces: newMap,
        isAnimating: true,
        pendingBoardUpdate: callback ?? null,
      };
    });

    return id;
  },

  completeAnimation: (id) => {
    set((state) => {
      const newMap = new Map(state.animatingPieces);
      newMap.delete(id);
      const stillAnimating = newMap.size > 0;

      return {
        animatingPieces: newMap,
        isAnimating: stillAnimating,
      };
    });

    const { pendingBoardUpdate } = get();
    if (pendingBoardUpdate) {
      pendingBoardUpdate();
      set({ pendingBoardUpdate: null });
    }
  },

  getAnimatingPiece: (id) => get().animatingPieces.get(id),

  isPositionAnimating: (row, col) => {
    const worldPos = boardToWorld(row, col);
    const pieces = get().animatingPieces;

    for (const piece of pieces.values()) {
      if (
        (piece.from.x === worldPos.x && piece.from.z === worldPos.z) ||
        (piece.to.x === worldPos.x && piece.to.z === worldPos.z)
      ) {
        return true;
      }
    }
    return false;
  },

  clearAllAnimations: () => {
    set({
      animatingPieces: new Map(),
      isAnimating: false,
      pendingBoardUpdate: null,
    });
  },

  setPendingBoardUpdate: (callback) => {
    set({ pendingBoardUpdate: callback });
  },

  executePendingUpdate: () => {
    const { pendingBoardUpdate } = get();
    if (pendingBoardUpdate) {
      pendingBoardUpdate();
      set({ pendingBoardUpdate: null });
    }
  },
}));

export const selectIsAnimating = (state: { isAnimating: boolean }) =>
  state.isAnimating;

export const selectAnimatingPieces = (state: {
  animatingPieces: Map<string, AnimatingPiece>;
}) => state.animatingPieces;
