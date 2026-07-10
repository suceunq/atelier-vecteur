import { create } from "zustand";
import type { ElementId } from "../scene/types";

interface TextEditState {
  editingId: ElementId | null;
  setEditingId: (id: ElementId | null) => void;
}

/** Which TextNode (if any) currently has its inline editor overlay open — independent of the active tool. */
export const useTextEditStore = create<TextEditState>((set) => ({
  editingId: null,
  setEditingId: (id) => set({ editingId: id }),
}));
