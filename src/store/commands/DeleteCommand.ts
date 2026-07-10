import type { ElementId, LayerId, SceneNode } from "../../scene/types";
import { useSceneStore } from "../sceneStore";
import type { Command } from "./Command";

interface RemovedEntry {
  node: SceneNode;
  layerId: LayerId;
  index: number;
}

export class DeleteCommand implements Command {
  label = "Supprimer";
  private removed: RemovedEntry[] = [];

  constructor(private ids: ElementId[]) {}

  do() {
    const { scene } = useSceneStore.getState();
    this.removed = [];
    for (const id of this.ids) {
      const node = scene.elements[id];
      if (!node) continue;
      const layer = scene.layers.find((l) => l.elementIds.includes(id));
      if (!layer) continue;
      this.removed.push({ node, layerId: layer.id, index: layer.elementIds.indexOf(id) });
    }
    for (const entry of this.removed) {
      useSceneStore.getState().removeElement(entry.node.id);
    }
  }

  undo() {
    for (const entry of this.removed) {
      useSceneStore.getState().addElement(entry.node, entry.layerId);
      useSceneStore.getState().reorderElement(entry.layerId, entry.node.id, entry.index);
    }
  }
}
