import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createEmptyScene, createLayer } from "../scene/factory";
import { refreshGroupBounds } from "../scene/geometry";
import { t } from "../i18n";
import type {
  Artboard,
  ArtboardId,
  ElementId,
  Filter,
  FilterId,
  Gradient,
  GradientId,
  Layer,
  LayerId,
  Pattern,
  PatternId,
  Scene,
  SceneNode,
  Style,
  Transform,
} from "../scene/types";

interface SceneState {
  scene: Scene;
  addElement: (node: SceneNode, layerId?: LayerId) => void;
  /** Restores a node into scene.elements without listing it in any layer — used to bring back a group's children (referenced only via the group's childIds) when undoing a delete. */
  addElementOnly: (node: SceneNode) => void;
  removeElement: (id: ElementId) => void;
  updateElementTransform: (id: ElementId, transform: Partial<Transform>) => void;
  updateElementStyle: (id: ElementId, style: Partial<Style>) => void;
  updateElementGeometry: (id: ElementId, patch: Record<string, unknown>) => void;
  addGradient: (gradient: Gradient) => void;
  updateGradient: (id: GradientId, patch: Partial<Gradient>) => void;
  removeGradient: (id: GradientId) => void;
  addPattern: (pattern: Pattern) => void;
  updatePattern: (id: PatternId, patch: Partial<Pattern>) => void;
  removePattern: (id: PatternId) => void;
  addFilter: (filter: Filter) => void;
  updateFilter: (id: FilterId, patch: Partial<Filter>) => void;
  removeFilter: (id: FilterId) => void;
  addLayer: (name?: string) => Layer;
  removeLayer: (id: LayerId) => void;
  renameLayer: (id: LayerId, name: string) => void;
  toggleLayerVisibility: (id: LayerId) => void;
  toggleLayerLock: (id: LayerId) => void;
  reorderLayer: (id: LayerId, toIndex: number) => void;
  reorderElement: (layerId: LayerId, elementId: ElementId, toIndex: number) => void;
  /** Removes an id from a layer's top-level list without deleting the element itself — used when an element becomes a group's child. */
  removeElementIdFromLayer: (layerId: LayerId, elementId: ElementId) => void;
  /** Inserts an existing element's id back into a layer's top-level list (optionally at a specific index) — the ungroup counterpart of removeElementIdFromLayer. */
  insertElementIdInLayer: (layerId: LayerId, elementId: ElementId, index?: number) => void;
  findLayerOfElement: (id: ElementId) => LayerId | null;
  /** If `id` is a child of some group, returns that group's id (one level only); otherwise returns `id` unchanged. */
  findTopLevelId: (id: ElementId) => ElementId;
  addArtboard: (artboard: Artboard) => void;
  removeArtboard: (id: ArtboardId) => void;
  updateArtboard: (id: ArtboardId, patch: Partial<Artboard>) => void;
  replaceScene: (scene: Scene) => void;
}

export const useSceneStore = create<SceneState>()(
  immer((set, get) => ({
    scene: createEmptyScene(),

    addElementOnly: (node) =>
      set((state) => {
        state.scene.elements[node.id] = node;
      }),

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
        refreshGroupBounds(state.scene as Scene);
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
        refreshGroupBounds(state.scene as Scene);
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

    addPattern: (pattern) =>
      set((state) => {
        state.scene.patterns[pattern.id] = pattern;
      }),

    updatePattern: (id, patch) =>
      set((state) => {
        const pattern = state.scene.patterns[id];
        if (pattern) Object.assign(pattern, patch);
      }),

    removePattern: (id) =>
      set((state) => {
        delete state.scene.patterns[id];
      }),

    addFilter: (filter) =>
      set((state) => {
        state.scene.filters[filter.id] = filter;
      }),

    updateFilter: (id, patch) =>
      set((state) => {
        const filter = state.scene.filters[id];
        if (filter) Object.assign(filter, patch);
      }),

    removeFilter: (id) =>
      set((state) => {
        delete state.scene.filters[id];
      }),

    addArtboard: (artboard) =>
      set((state) => {
        state.scene.artboards.push(artboard);
      }),

    removeArtboard: (id) =>
      set((state) => {
        if (state.scene.artboards.length <= 1) return;
        state.scene.artboards = state.scene.artboards.filter((a) => a.id !== id);
      }),

    updateArtboard: (id, patch) =>
      set((state) => {
        const artboard = state.scene.artboards.find((a) => a.id === id);
        if (artboard) Object.assign(artboard, patch);
      }),

    addLayer: (name) => {
      const layer = createLayer(name ?? t("layer.defaultName", { number: get().scene.layers.length + 1 }));
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

    removeElementIdFromLayer: (layerId, elementId) =>
      set((state) => {
        const layer = state.scene.layers.find((l) => l.id === layerId);
        if (layer) layer.elementIds = layer.elementIds.filter((id) => id !== elementId);
      }),

    insertElementIdInLayer: (layerId, elementId, index) =>
      set((state) => {
        const layer = state.scene.layers.find((l) => l.id === layerId);
        if (!layer) return;
        if (index === undefined || index >= layer.elementIds.length) {
          layer.elementIds.push(elementId);
        } else {
          layer.elementIds.splice(index, 0, elementId);
        }
      }),

    findLayerOfElement: (id) => {
      const layer = get().scene.layers.find((l) => l.elementIds.includes(id));
      return layer ? layer.id : null;
    },

    findTopLevelId: (id) => {
      const { elements } = get().scene;
      for (const el of Object.values(elements)) {
        if (el.type === "group" && el.childIds.includes(id)) return el.id;
      }
      return id;
    },

    replaceScene: (scene) =>
      set((state) => {
        state.scene = scene;
        refreshGroupBounds(state.scene as Scene);
      }),
  }))
);
