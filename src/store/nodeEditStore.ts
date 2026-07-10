import { create } from "zustand";

interface NodeEditState {
  selectedAnchorIndex: number | null;
  setSelectedAnchorIndex: (index: number | null) => void;
}

/** Which anchor (by index) is highlighted in the node-edit overlay — plain tool state wouldn't trigger a re-render. */
export const useNodeEditStore = create<NodeEditState>((set) => ({
  selectedAnchorIndex: null,
  setSelectedAnchorIndex: (index) => set({ selectedAnchorIndex: index }),
}));
