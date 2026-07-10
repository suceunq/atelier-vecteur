import { create } from "zustand";
import type { ElementId } from "../scene/types";

interface SelectionState {
  selectedIds: ElementId[];
  hoveredId: ElementId | null;
  select: (ids: ElementId[]) => void;
  toggle: (id: ElementId) => void;
  addToSelection: (ids: ElementId[]) => void;
  clear: () => void;
  setHovered: (id: ElementId | null) => void;
  isSelected: (id: ElementId) => boolean;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedIds: [],
  hoveredId: null,
  select: (ids) => set({ selectedIds: ids }),
  toggle: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((i) => i !== id)
        : [...state.selectedIds, id],
    })),
  addToSelection: (ids) =>
    set((state) => ({ selectedIds: Array.from(new Set([...state.selectedIds, ...ids])) })),
  clear: () => set({ selectedIds: [] }),
  setHovered: (id) => set({ hoveredId: id }),
  isSelected: (id) => get().selectedIds.includes(id),
}));
