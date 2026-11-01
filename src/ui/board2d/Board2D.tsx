import { useLayoutEffect, useRef } from "react";
import type { Player } from "@/shared/types/game.types";
import { isKing, ownerOf, squareLabel, type RuleOptions } from "@/engine";
import { useAnimationStore } from "@/match/animationStore";
import { getSquareInteractionFlags } from "@/match/squareVisualState";
import type { BoardViewProps } from "@/scene/types";
import beagleToken from "@/assets/beagle-token.webp";
import corgiToken from "@/assets/corgi-token.webp";

interface Board2DProps extends BoardViewProps {
  rules: RuleOptions;
  flipped: boolean;
}

const TOKENS: Record<Player, { image: string; ring: string; name: string }> = {
  beagle: { image: beagleToken, ring: "ring-amber-300", name: "бигль" },
  corgi: { image: corgiToken, ring: "ring-orange-500", name: "корги" },
};

const squareTone = (flags: ReturnType<typeof getSquareInteractionFlags>) => {
  if (flags.isSelected) {
    return "bg-emerald-700";
  }
  if (flags.isHint) {
    return "bg-teal-700";
  }
  if (flags.isLastMove) {
    return "bg-[#9C7B4B]";
  }
  return "bg-[#774936]";
};

export function Board2D({
  board,
  overlay,
  controllableSide,
  onSquareSelect,
  rules,
  flipped,
}: Board2DProps) {
  const size = board.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const activeMove = useAnimationStore((s) => s.activeMove);

  useLayoutEffect(() => {
    if (!activeMove) {
      return;
    }
    const { completeAnimation } = useAnimationStore.getState();
    const token = containerRef.current?.querySelector<HTMLElement>(
      `[data-square="${activeMove.fromRow}-${activeMove.fromCol}"]`
    );
    if (!token || typeof token.animate !== "function") {
      completeAnimation(activeMove.id);
      return;
    }
    const sign = flipped ? -1 : 1;
    const cell = token.parentElement?.getBoundingClientRect().width ?? 0;
    const dx = (activeMove.toCol - activeMove.fromCol) * cell * sign;
    const dy = (activeMove.toRow - activeMove.fromRow) * cell * sign;
    token.style.zIndex = "20";
    const animation = token.animate(
      [
        { transform: "translate(0, 0) scale(1)" },
        {
          transform: `translate(${dx / 2}px, ${dy / 2}px) scale(${activeMove.isCapture ? 1.3 : 1.1})`,
        },
        { transform: `translate(${dx}px, ${dy}px) scale(1)` },
      ],
      { duration: activeMove.duration, easing: "ease-in-out", fill: "forwards" }
    );
    animation.onfinish = () => completeAnimation(activeMove.id);
    return () => {
      animation.onfinish = null;
    };
  }, [activeMove, flipped]);

  const order = Array.from({ length: size }, (_, i) =>
    flipped ? size - 1 - i : i
  );

  return (
    <div className="flex h-full w-full items-center justify-center bg-linear-to-b from-zinc-900 to-zinc-950 p-2 pt-14 pb-16">
      <div
        ref={containerRef}
        role="group"
        aria-label="Шашечная доска"
        className="grid aspect-square w-[min(100%,calc(100dvh-8.5rem))] overflow-hidden rounded-lg border-4 border-[#5b3a22] shadow-2xl"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
        {order.flatMap((row) =>
          order.map((col) => {
            const flags = getSquareInteractionFlags(row, col, {
              ...overlay,
              hoveredSquare: null,
            });
            if (!flags.isDarkSquare) {
              return (
                <div
                  key={`${row}-${col}`}
                  aria-hidden
                  className="bg-[#E8D0AA]"
                />
              );
            }
            const piece = board[row][col];
            const owner = ownerOf(piece);
            const label = squareLabel({ row, col }, rules);
            const pieceName = owner
              ? `${isKing(piece) ? "дамка " : ""}${TOKENS[owner].name}`
              : "пусто";
            return (
              <button
                key={`${row}-${col}`}
                type="button"
                tabIndex={-1}
                data-board-surface="true"
                aria-label={`Поле ${label}: ${pieceName}`}
                aria-pressed={flags.isSelected}
                onClick={() => onSquareSelect(row, col)}
                className={`relative ${squareTone(flags)} ${
                  flags.isCursor
                    ? "outline-3 -outline-offset-3 outline-yellow-300"
                    : ""
                } ${owner && owner === controllableSide ? "cursor-pointer" : "cursor-default"}`}>
                <span className="pointer-events-none absolute bottom-0.5 right-1 text-[0.55rem] leading-none text-white/45 sm:text-[0.65rem]">
                  {label}
                </span>
                {flags.hasCapturePiece && (
                  <span className="pointer-events-none absolute inset-0 ring-3 ring-inset ring-red-400/80" />
                )}
                {flags.isValidMove && (
                  <span className="pointer-events-none absolute inset-[34%] rounded-full bg-sky-400/80 shadow" />
                )}
                {owner && (
                  <span
                    data-square={`${row}-${col}`}
                    className={`pointer-events-none absolute inset-[9%] rounded-full bg-cover bg-center shadow-md ring-3 ${TOKENS[owner].ring} ${
                      flags.isPendingCapture ? "opacity-40 grayscale" : ""
                    }`}
                    style={{ backgroundImage: `url(${TOKENS[owner].image})` }}>
                    {isKing(piece) && (
                      <span
                        className="absolute -right-1 -top-2 text-sm drop-shadow sm:text-base"
                        aria-hidden>
                        👑
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Board2D;
