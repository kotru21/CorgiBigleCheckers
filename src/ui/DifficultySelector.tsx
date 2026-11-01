import { useGameStore } from "@/match/gameStore";
import { DIFFICULTY_ITEMS } from "./menuModeItems";
import { SegmentedControl } from "./SegmentedControl";

export function DifficultySelector() {
  const difficulty = useGameStore((s) => s.difficulty);
  const setDifficulty = useGameStore((s) => s.setDifficulty);

  return (
    <SegmentedControl
      label="Сила бота"
      value={difficulty}
      options={DIFFICULTY_ITEMS.map((item) => ({
        value: item.difficulty,
        title: item.title,
      }))}
      onChange={setDifficulty}
    />
  );
}
