import { lazy, Suspense, useState } from "react";
import { MainMenu } from "@/ui/MainMenu";

const GameBoard = lazy(() => import("@/ui/GameBoard"));

function BoardLoading() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-zinc-950 text-sm text-zinc-400"
      role="status">
      Расставляем фигуры…
    </div>
  );
}

const App = () => {
  const [gameStarted, setGameStarted] = useState(false);

  if (!gameStarted) {
    return <MainMenu onStartGame={() => setGameStarted(true)} />;
  }

  return (
    <Suspense fallback={<BoardLoading />}>
      <GameBoard onReturnToMenu={() => setGameStarted(false)} />
    </Suspense>
  );
};

export default App;
