import { create } from "zustand";
import type { BBox } from "../scene/geometry";
import type { SceneNode } from "../scene/types";

interface DraftState {
  draftNode: SceneNode | null;
  marquee: BBox | null;
  setDraftNode: (node: SceneNode | null) => void;
  setMarquee: (box: BBox | null) => void;
}

/** Transient, non-undoable UI state: the in-progress shape being drawn, and the marquee-selection rectangle. */
export const useDraftStore = create<DraftState>((set) => ({
  draftNode: null,
  marquee: null,
  setDraftNode: (node) => set({ draftNode: node }),
  setMarquee: (box) => set({ marquee: box }),
}));
