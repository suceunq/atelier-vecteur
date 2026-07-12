import { create } from "zustand";

interface DocumentState {
  currentPath: string | null;
  dirty: boolean;
  lastSavedAt: number | null;
  recoveryAvailable: boolean;
  setPath: (path: string | null) => void;
  markDirty: () => void;
  markSaved: (path?: string | null) => void;
  setRecoveryAvailable: (available: boolean) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  currentPath: null,
  dirty: false,
  lastSavedAt: null,
  recoveryAvailable: false,
  setPath: (currentPath) => set({ currentPath }),
  markDirty: () => set({ dirty: true }),
  markSaved: (path) =>
    set((state) => ({
      currentPath: path === undefined ? state.currentPath : path,
      dirty: false,
      lastSavedAt: Date.now(),
    })),
  setRecoveryAvailable: (recoveryAvailable) => set({ recoveryAvailable }),
}));
