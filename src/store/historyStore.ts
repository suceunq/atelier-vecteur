import { create } from "zustand";
import type { Command } from "./commands/Command";

interface HistoryState {
  undoStack: Command[];
  redoStack: Command[];
  execute: (command: Command) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],

  execute: (command) => {
    command.do();
    set((state) => ({ undoStack: [...state.undoStack, command], redoStack: [] }));
  },

  undo: () => {
    const { undoStack, redoStack } = get();
    const command = undoStack[undoStack.length - 1];
    if (!command) return;
    command.undo();
    set({ undoStack: undoStack.slice(0, -1), redoStack: [...redoStack, command] });
  },

  redo: () => {
    const { undoStack, redoStack } = get();
    const command = redoStack[redoStack.length - 1];
    if (!command) return;
    command.do();
    set({ redoStack: redoStack.slice(0, -1), undoStack: [...undoStack, command] });
  },

  clear: () => set({ undoStack: [], redoStack: [] }),
}));
