import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Position } from "@/shared/types/game.types";
import type { BoardView } from "../preferencesStore";

interface BoardKeyboardOptions {
  size: number;
  view: BoardView;
  flipped: boolean;
  enabled: boolean;
  onSelect: (square: Position) => void;
  onCancel: () => void;
  onUndo: () => void;
  onHint: () => void;
}

type Arrow = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";

const STEP_2D: Record<Arrow, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

const STEP_3D: Record<Arrow, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

const isActivatable = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  target !== document.body &&
  !target.dataset.boardSurface &&
  ["BUTTON", "A"].includes(target.tagName);

export function useBoardKeyboard(options: BoardKeyboardOptions) {
  const [cursor, setCursor] = useState<Position | null>(null);
  const optionsRef = useRef(options);
  const cursorRef = useRef(cursor);

  useLayoutEffect(() => {
    optionsRef.current = options;
    cursorRef.current = cursor;
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const current = optionsRef.current;
      if (
        !current.enabled ||
        event.altKey ||
        event.metaKey ||
        isTyping(event.target)
      ) {
        return;
      }
      const { size } = current;
      const clamp = (value: number) => Math.min(size - 1, Math.max(0, value));

      if (event.key in STEP_2D) {
        event.preventDefault();
        const [dRow, dCol] = (current.view === "3d" ? STEP_3D : STEP_2D)[
          event.key as Arrow
        ];
        const sign = current.view === "2d" && current.flipped ? -1 : 1;
        setCursor((previous) => {
          if (!previous) {
            return { row: size / 2, col: size / 2 - 1 };
          }
          return {
            row: clamp(previous.row + dRow * sign),
            col: clamp(previous.col + dCol * sign),
          };
        });
        return;
      }

      if ((event.key === "Enter" || event.key === " ") && cursorRef.current) {
        if (isActivatable(event.target)) {
          return;
        }
        event.preventDefault();
        current.onSelect(cursorRef.current);
        return;
      }

      if (event.ctrlKey && event.code !== "KeyZ") {
        return;
      }
      if (event.key === "Escape") {
        current.onCancel();
      } else if (event.code === "KeyZ" || event.key === "Backspace") {
        event.preventDefault();
        current.onUndo();
      } else if (event.code === "KeyH") {
        current.onHint();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const insideBoard =
    cursor && cursor.row < options.size && cursor.col < options.size
      ? cursor
      : null;

  return { cursor: insideBoard, hideCursor: () => setCursor(null) };
}
