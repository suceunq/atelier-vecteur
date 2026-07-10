import { useState } from "react";
import type { Layer } from "../../scene/types";
import { GenericCommand } from "../../store/commands/GenericCommand";
import { useHistoryStore } from "../../store/historyStore";
import { useSceneStore } from "../../store/sceneStore";
import { useSelectionStore } from "../../store/selectionStore";

interface Props {
  layer: Layer;
  /** True if this layer is already at the top of the stack (last in scene.layers). */
  isTop: boolean;
  /** True if this layer is already at the bottom of the stack (first in scene.layers). */
  isBottom: boolean;
}

export function LayerRow({ layer, isTop, isBottom }: Props) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(layer.name);
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const isActive = layer.elementIds.some((id) => selectedIds.includes(id));

  const commitRename = () => {
    setEditingName(false);
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === layer.name) return;
    const before = layer.name;
    useHistoryStore
      .getState()
      .execute(
        new GenericCommand(
          "Renommer le calque",
          () => useSceneStore.getState().renameLayer(layer.id, trimmed),
          () => useSceneStore.getState().renameLayer(layer.id, before)
        )
      );
  };

  const moveLayer = (toIndex: number) => {
    const scene = useSceneStore.getState().scene;
    const fromIndex = scene.layers.findIndex((l) => l.id === layer.id);
    useHistoryStore
      .getState()
      .execute(
        new GenericCommand(
          "Réordonner les calques",
          () => useSceneStore.getState().reorderLayer(layer.id, toIndex),
          () => useSceneStore.getState().reorderLayer(layer.id, fromIndex)
        )
      );
  };

  const deleteLayer = () => {
    const scene = useSceneStore.getState().scene;
    const index = scene.layers.findIndex((l) => l.id === layer.id);
    const snapshot = JSON.parse(JSON.stringify(layer)) as Layer;
    const elementSnapshots = layer.elementIds.map((id) => JSON.parse(JSON.stringify(scene.elements[id])));
    useHistoryStore.getState().execute(
      new GenericCommand(
        "Supprimer le calque",
        () => useSceneStore.getState().removeLayer(layer.id),
        () => {
          const store = useSceneStore.getState();
          store.replaceScene({
            ...store.scene,
            layers: [
              ...store.scene.layers.slice(0, index),
              snapshot,
              ...store.scene.layers.slice(index),
            ],
            elements: {
              ...store.scene.elements,
              ...Object.fromEntries(elementSnapshots.map((n) => [n.id, n])),
            },
          });
        }
      )
    );
  };

  return (
    <div className={`layer-row ${isActive ? "layer-row-active" : ""}`}>
      <button
        className="icon-button"
        title={layer.visible ? "Masquer" : "Afficher"}
        onClick={() => useSceneStore.getState().toggleLayerVisibility(layer.id)}
      >
        {layer.visible ? "👁" : "🚫"}
      </button>
      <button
        className="icon-button"
        title={layer.locked ? "Déverrouiller" : "Verrouiller"}
        onClick={() => useSceneStore.getState().toggleLayerLock(layer.id)}
      >
        {layer.locked ? "🔒" : "🔓"}
      </button>

      {editingName ? (
        <input
          autoFocus
          className="layer-name-input"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") {
              setNameDraft(layer.name);
              setEditingName(false);
            }
          }}
        />
      ) : (
        <span className="layer-name" onDoubleClick={() => setEditingName(true)}>
          {layer.name}
        </span>
      )}

      <button className="icon-button" disabled={isTop} title="Monter" onClick={() => moveLayer(indexAfterUp())}>
        ▲
      </button>
      <button className="icon-button" disabled={isBottom} title="Descendre" onClick={() => moveLayer(indexAfterDown())}>
        ▼
      </button>
      <button className="icon-button" title="Supprimer le calque" onClick={deleteLayer}>
        🗑
      </button>
    </div>
  );

  function indexAfterUp() {
    const scene = useSceneStore.getState().scene;
    const from = scene.layers.findIndex((l) => l.id === layer.id);
    return Math.min(scene.layers.length - 1, from + 1);
  }

  function indexAfterDown() {
    const scene = useSceneStore.getState().scene;
    const from = scene.layers.findIndex((l) => l.id === layer.id);
    return Math.max(0, from - 1);
  }
}
