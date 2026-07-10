import { create } from "zustand";
import type { ToolId } from "../tools/ToolManager";

export type { ToolId };

interface ToolState {
  activeTool: ToolId;
  setActiveTool: (tool: ToolId) => void;
}

export const useToolStore = create<ToolState>((set) => ({
  activeTool: "select",
  setActiveTool: (tool) => set({ activeTool: tool }),
}));
