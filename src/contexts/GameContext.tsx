import type { ReactNode } from "react";

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  return <>{children}</>;
}
