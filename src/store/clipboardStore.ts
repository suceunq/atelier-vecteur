import { create } from "zustand";
import type { SceneNode } from "../scene/types";

interface ClipboardState {
  copiedNodes: SceneNode[];
  setCopiedNodes: (nodes: SceneNode[]) => void;
}

/** Holds a deep-cloned snapshot of the copied selection — plain data, no store coupling. */
export const useClipboardStore = create<ClipboardState>((set) => ({
  copiedNodes: [],
  setCopiedNodes: (nodes) => set({ copiedNodes: nodes }),
}));
