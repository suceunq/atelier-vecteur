import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createEmptyScene, createLayer } from "../scene/factory";
import type {
  ElementId,
  Gradient,
  GradientId,
  Layer,
  LayerId,
  Scene,
  SceneNode,
  Style,
  Transform,
} from "../scene/types";

interface SceneState {
  scene: Scene;
  addElement: (node: SceneNode, layerId?: LayerId) => void;
  removeElement: (id: ElementId) => void;
  updateElementTransform: (id: ElementId, transform: Partial<Transform>) => void;
  updateElementStyle: (id: ElementId, style: Partial<Style>) => void;
  updateElementGeometry: (id: ElementId, patch: Record<string, unknown>) => void;
  addGradient: (gradient: Gradient) => void;
  updateGradient: (id: GradientId, patch: Partial<Gradient>) => void;
  removeGradient: (id: GradientId) => void;
  addLayer: (name?: string) => Layer;
  removeLayer: (id: LayerId) => void;
  renameLayer: (id: LayerId, name: string) => void;
  toggleLayerVisibility: (id: LayerId) => void;
  toggleLayerLock: (id: LayerId) => void;
  reorderLayer: (id: LayerId, toIndex: number) => void;
  reorderElement: (layerId: LayerId, elementId: ElementId, toIndex: number) => void;
  findLayerOfElement: (id: ElementId) => LayerId | null;
  replaceScene: (scene: Scene) => void;
}

export const useSceneStore = create<SceneState>()(
  immer((set, get) => ({
    scene: createEmptyScene(),

    addElement: (node, layerId) =>
      set((state) => {
        state.scene.elements[node.id] = node;
        const targetLayerId = layerId ?? state.scene.layers[state.scene.layers.length - 1]?.id;
        const layer = state.scene.layers.find((l) => l.id === targetLayerId);
        if (layer) layer.elementIds.push(node.id);
      }),

    removeElement: (id) =>
      set((state) => {
        delete state.scene.elements[id];
        for (const layer of state.scene.layers) {
          layer.elementIds = layer.elementIds.filter((eid) => eid !== id);
        }
      }),

    updateElementTransform: (id, transform) =>
      set((state) => {
        const el = state.scene.elements[id];
        if (el) Object.assign(el.transform, transform);
      }),

    updateElementStyle: (id, style) =>
      set((state) => {
        const el = state.scene.elements[id];
        if (el) Object.assign(el.style, style);
      }),

    updateElementGeometry: (id, patch) =>
      set((state) => {
        const el = state.scene.elements[id];
        if (el) Object.assign(el, patch);
      }),

    addGradient: (gradient) =>
      set((state) => {
        state.scene.gradients[gradient.id] = gradient;
      }),

    updateGradient: (id, patch) =>
      set((state) => {
        const gradient = state.scene.gradients[id];
        if (gradient) Object.assign(gradient, patch);
      }),

    removeGradient: (id) =>
      set((state) => {
        delete state.scene.gradients[id];
      }),

    addLayer: (name) => {
      const layer = createLayer(name ?? `Calque ${get().scene.layers.length + 1}`);
      set((state) => {
        state.scene.layers.push(layer);
      });
      return layer;
    },

    removeLayer: (id) =>
      set((state) => {
        const layer = state.scene.layers.find((l) => l.id === id);
        if (layer) {
          for (const eid of layer.elementIds) delete state.scene.elements[eid];
        }
        state.scene.layers = state.scene.layers.filter((l) => l.id !== id);
      }),

    renameLayer: (id, name) =>
      set((state) => {
        const layer = state.scene.layers.find((l) => l.id === id);
        if (layer) layer.name = name;
      }),

    toggleLayerVisibility: (id) =>
      set((state) => {
        const layer = state.scene.layers.find((l) => l.id === id);
        if (layer) layer.visible = !layer.visible;
      }),

    toggleLayerLock: (id) =>
      set((state) => {
        const layer = state.scene.layers.find((l) => l.id === id);
        if (layer) layer.locked = !layer.locked;
      }),

    reorderLayer: (id, toIndex) =>
      set((state) => {
        const fromIndex = state.scene.layers.findIndex((l) => l.id === id);
        if (fromIndex === -1) return;
        const [layer] = state.scene.layers.splice(fromIndex, 1);
        state.scene.layers.splice(toIndex, 0, layer);
      }),

    reorderElement: (layerId, elementId, toIndex) =>
      set((state) => {
        const layer = state.scene.layers.find((l) => l.id === layerId);
        if (!layer) return;
        const fromIndex = layer.elementIds.indexOf(elementId);
        if (fromIndex === -1) return;
        layer.elementIds.splice(fromIndex, 1);
        layer.elementIds.splice(toIndex, 0, elementId);
      }),

    findLayerOfElement: (id) => {
      const layer = get().scene.layers.find((l) => l.elementIds.includes(id));
      return layer ? layer.id : null;
    },

    replaceScene: (scene) =>
      set((state) => {
        state.scene = scene;
      }),
  }))
);
