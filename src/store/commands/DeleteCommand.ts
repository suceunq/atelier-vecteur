import type { ElementId, LayerId, SceneNode } from "../../scene/types";
import { useSceneStore } from "../sceneStore";
import type { Command } from "./Command";

interface RemovedEntry {
  node: SceneNode;
  layerId: LayerId;
  index: number;
}

/** Expands a set of top-level ids to also include every descendant of any group among them, so deleting a group doesn't leak orphaned children still sitting in scene.elements. */
function expandWithGroupChildren(ids: ElementId[], elements: Record<ElementId, SceneNode>): ElementId[] {
  const expanded = new Set(ids);
  for (const id of ids) {
    const node = elements[id];
    if (node?.type === "group") {
      for (const childId of node.childIds) expanded.add(childId);
    }
  }
  return [...expanded];
}

export class DeleteCommand implements Command {
  label = "Supprimer";
  private removed: RemovedEntry[] = [];

  constructor(private ids: ElementId[]) {}

  do() {
    const { scene } = useSceneStore.getState();
    const allIds = expandWithGroupChildren(this.ids, scene.elements);
    this.removed = [];
    for (const id of allIds) {
      const node = scene.elements[id];
      if (!node) continue;
      const layer = scene.layers.find((l) => l.elementIds.includes(id));
      // A group's children aren't in any layer's top-level list (they're only referenced via
      // the group's childIds) — record them with the group's own layer/index so undo can still
      // put the group back in the right place; the children themselves don't need a real index
      // since re-adding the group restores their visibility.
      this.removed.push({ node, layerId: layer?.id ?? "", index: layer ? layer.elementIds.indexOf(id) : -1 });
    }
    for (const entry of this.removed) {
      useSceneStore.getState().removeElement(entry.node.id);
    }
  }

  undo() {
    for (const entry of this.removed) {
      if (!entry.layerId) {
        // A group child with no top-level layer entry of its own — just restore it into
        // scene.elements so the (also-restored) group can reference it again.
        useSceneStore.getState().addElementOnly(entry.node);
        continue;
      }
      useSceneStore.getState().addElement(entry.node, entry.layerId);
      useSceneStore.getState().reorderElement(entry.layerId, entry.node.id, entry.index);
    }
  }
}
