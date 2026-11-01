import { create } from "zustand";
import { readStored, writeStored } from "@/shared/storage";

export type BoardView = "3d" | "2d";

const isView = (value: unknown): value is BoardView =>
  value === "3d" || value === "2d";
const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

interface Preferences {
  view: BoardView;
  sound: boolean;
  setView: (view: BoardView) => void;
  setSound: (sound: boolean) => void;
}

export const usePreferences = create<Preferences>((set) => ({
  view: readStored("view", isView) ?? "3d",
  sound: readStored("sound", isBoolean) ?? true,
  setView: (view) => {
    writeStored("view", view);
    set({ view });
  },
  setSound: (sound) => {
    writeStored("sound", sound);
    set({ sound });
  },
}));
