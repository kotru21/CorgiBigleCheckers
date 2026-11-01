import { useEffect } from "react";
import { useAnimationStore } from "@/match/animationStore";
import { useGameStore } from "@/match/gameStore";
import { sounds } from "../sound";

export function useMatchSounds(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const stopAnimations = useAnimationStore.subscribe((state, previous) => {
      const move = state.activeMove;
      if (move && move.id !== previous.activeMove?.id) {
        (move.isCapture ? sounds.capture : sounds.move)();
      }
    });
    const stopGame = useGameStore.subscribe((state, previous) => {
      if (state.puzzleMistakes > previous.puzzleMistakes) {
        sounds.error();
      }
      if (
        state.history.length > previous.history.length &&
        state.history.at(-1)?.move.promotes
      ) {
        sounds.promote();
      }
      if (state.result && !previous.result) {
        if (state.result.kind === "draw") {
          sounds.draw();
        } else if (
          state.settings.opponent === "human" ||
          state.result.winner === state.settings.humanSide
        ) {
          sounds.win();
        } else {
          sounds.lose();
        }
      }
    });
    return () => {
      stopAnimations();
      stopGame();
    };
  }, [enabled]);
}
