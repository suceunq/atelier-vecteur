import { create } from "zustand";
import type { Point } from "../scene/types";

interface ViewportState {
  pan: Point;
  zoom: number;
  gridSize: number;
  showGrid: boolean;
  snapEnabled: boolean;
  cursorUser: Point | null;
  setPan: (pan: Point) => void;
  setZoom: (zoom: number, pivot?: Point) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  setCursorUser: (point: Point | null) => void;
}

export const useViewportStore = create<ViewportState>((set, get) => ({
  pan: { x: 0, y: 0 },
  zoom: 1,
  gridSize: 20,
  showGrid: true,
  snapEnabled: true,
  cursorUser: null,
  setCursorUser: (point) => set({ cursorUser: point }),
  setPan: (pan) => set({ pan }),
  setZoom: (zoom, pivot) => {
    const clamped = Math.min(8, Math.max(0.05, zoom));
    if (!pivot) {
      set({ zoom: clamped });
      return;
    }
    const { pan, zoom: oldZoom } = get();
    const scaleRatio = clamped / oldZoom;
    const newPan = {
      x: pivot.x - (pivot.x - pan.x) * scaleRatio,
      y: pivot.y - (pivot.y - pan.y) * scaleRatio,
    };
    set({ zoom: clamped, pan: newPan });
  },
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),
}));
