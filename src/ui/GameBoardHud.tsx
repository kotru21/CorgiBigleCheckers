import { useEffect, useState } from "react";
import {
  usePerformanceStore,
  type PerformanceMode,
} from "@/scene/performanceStore";
import { isFullscreenSupported, useFullscreen } from "./hooks/useFullscreen";
import { usePreferences } from "./preferencesStore";

const HUD_BTN_CLASS =
  "inline-flex h-8 min-h-8 shrink-0 items-center justify-center gap-1 rounded-full bg-black/45 px-2.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-zinc-100 shadow-sm backdrop-blur-md transition-[background-color,color,opacity] duration-200 cursor-pointer hover:bg-black/60 disabled:cursor-default disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400/80 sm:px-3";

const PERF_DOT_CLASS: Record<PerformanceMode, string> = {
  high: "bg-zinc-400",
  medium: "bg-amber-400",
  low: "bg-red-500",
};

function FpsValue() {
  const fps = usePerformanceStore((s) => s.fps);
  return <span className="tabular-nums">{fps}</span>;
}

function FpsButton() {
  const [visible, setVisible] = useState(false);
  const mode = usePerformanceStore((s) => s.mode);

  return (
    <button
      type="button"
      className={`${HUD_BTN_CLASS} hidden sm:inline-flex ${visible ? "text-orange-200" : ""}`}
      onClick={() => setVisible((v) => !v)}
      aria-pressed={visible}
      title="Производительность / FPS">
      <span
        className={`inline-block size-1.5 shrink-0 rounded-full ${PERF_DOT_CLASS[mode]}`}
        aria-hidden
      />
      {visible ? <FpsValue /> : <span>FPS</span>}
    </button>
  );
}

const RESIGN_CONFIRM_MS = 3000;

function ResignButton({ onResign }: { onResign: () => void }) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) {
      return;
    }
    const timer = setTimeout(() => setConfirming(false), RESIGN_CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [confirming]);

  return (
    <button
      type="button"
      className={`${HUD_BTN_CLASS} ${confirming ? "bg-red-700/80 hover:bg-red-700" : ""}`}
      onClick={() => (confirming ? onResign() : setConfirming(true))}>
      {confirming ? "Точно сдаться?" : "Сдаться"}
    </button>
  );
}

export interface GameBoardHudProps {
  containerId: string;
  gameMessage: string;
  gameOver: boolean;
  canUndo: boolean;
  canHint: boolean;
  hintPending: boolean;
  canResign: boolean;
  historyOpen: boolean;
  onUndo: () => void;
  onHint: () => void;
  onToggleHistory: () => void;
  onResign: () => void;
  onOpenRules: () => void;
  onOpenModeSelector: () => void;
  onReturnToMenu: () => void;
}

export function GameBoardHud({
  containerId,
  gameMessage,
  gameOver,
  canUndo,
  canHint,
  hintPending,
  canResign,
  historyOpen,
  onUndo,
  onHint,
  onToggleHistory,
  onResign,
  onOpenRules,
  onOpenModeSelector,
  onReturnToMenu,
}: GameBoardHudProps) {
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerId);
  const [canFullscreen] = useState(isFullscreenSupported);
  const view = usePreferences((s) => s.view);
  const setView = usePreferences((s) => s.setView);
  const sound = usePreferences((s) => s.sound);
  const setSound = usePreferences((s) => s.setSound);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col">
      <div className="safe-pt safe-px flex w-full shrink-0 items-center gap-1.5 pt-1.5 sm:gap-2 sm:pt-2">
        <p
          className="pointer-events-none flex h-8 min-h-8 min-w-0 max-w-[min(100%,15.5rem)] items-center rounded-full bg-black/40 px-2.5 text-left text-[10px] leading-none text-zinc-100 shadow-sm backdrop-blur-md sm:max-w-[20rem] sm:px-3 sm:text-[11px]"
          role="status"
          aria-live="polite"
          title={gameMessage}>
          <span className="min-w-0 truncate">{gameMessage}</span>
        </p>
        <div className="pointer-events-auto ml-auto flex h-8 min-h-8 shrink-0 items-center justify-center gap-1.5">
          {view === "3d" && <FpsButton />}
          {canFullscreen && (
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className={HUD_BTN_CLASS}
              aria-pressed={isFullscreen}
              title={
                isFullscreen ? "Выйти из полноэкранного режима" : "Полный экран"
              }>
              <span aria-hidden>{isFullscreen ? "⤡" : "⤢"}</span>
              <span className="sr-only">
                {isFullscreen
                  ? "Выйти из полноэкранного режима"
                  : "Полный экран"}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setSound(!sound)}
            className={HUD_BTN_CLASS}
            aria-pressed={sound}
            title={sound ? "Выключить звук" : "Включить звук"}>
            <span aria-hidden>{sound ? "🔊" : "🔇"}</span>
            <span className="sr-only">Звук</span>
          </button>
          <button
            type="button"
            onClick={() => setView(view === "3d" ? "2d" : "3d")}
            className={HUD_BTN_CLASS}
            title={view === "3d" ? "Плоская доска" : "Объёмная доска"}>
            {view === "3d" ? "2D" : "3D"}
          </button>
          <button
            type="button"
            onClick={onOpenRules}
            className={HUD_BTN_CLASS}
            title="Правила">
            ?
          </button>
          <button
            type="button"
            onClick={onOpenModeSelector}
            className={HUD_BTN_CLASS}
            title="Сменить режим">
            Режим
          </button>
          <button
            type="button"
            onClick={onReturnToMenu}
            className={`${HUD_BTN_CLASS} text-orange-200`}
            title="В главное меню">
            Меню
          </button>
        </div>
      </div>

      {!gameOver && (
        <div className="safe-pb safe-px pointer-events-auto mt-auto flex flex-wrap items-center justify-center gap-1.5 pb-2 sm:gap-2 sm:pb-3">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={HUD_BTN_CLASS}
            title="Отменить ход (Z)">
            ↶ Отменить
          </button>
          <button
            type="button"
            onClick={onHint}
            disabled={!canHint}
            className={HUD_BTN_CLASS}
            title="Подсказка (H)">
            {hintPending ? "Думаю…" : "Подсказка"}
          </button>
          <button
            type="button"
            onClick={onToggleHistory}
            aria-pressed={historyOpen}
            className={`${HUD_BTN_CLASS} ${historyOpen ? "text-orange-200" : ""}`}>
            Запись
          </button>
          {canResign && <ResignButton onResign={onResign} />}
        </div>
      )}
    </div>
  );
}
