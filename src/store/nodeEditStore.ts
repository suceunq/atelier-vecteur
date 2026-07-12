import { create } from "zustand";

export interface AnchorRef {
  subpathIndex: number;
  anchorIndex: number;
}

interface NodeEditState {
  selectedAnchor: AnchorRef | null;
  setSelectedAnchor: (ref: AnchorRef | null) => void;
}

/** Which anchor is highlighted in the node-edit overlay — plain tool state wouldn't trigger a re-render. */
export const useNodeEditStore = create<NodeEditState>((set) => ({
  selectedAnchor: null,
  setSelectedAnchor: (ref) => set({ selectedAnchor: ref }),
}));
