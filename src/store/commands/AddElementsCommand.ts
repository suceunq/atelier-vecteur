import type { ElementId, LayerId, SceneNode } from "../../scene/types";
import { useSceneStore } from "../sceneStore";
import type { Command } from "./Command";

/** Adds multiple elements as a single undo step — used for paste/duplicate/image tracing. */
export class AddElementsCommand implements Command {
  label: string;

  /**
   * @param childOnlyIds Nodes in this set are restored via `addElementOnly` (present only in
   * `scene.elements`, not listed in any layer) instead of `addElement` — used when the batch
   * includes a GroupNode plus its already-grouped children (e.g. traced-image import), mirroring
   * how `DeleteCommand` restores group children on undo.
   */
  constructor(
    private nodes: SceneNode[],
    private layerId?: LayerId,
    label = "Coller",
    private childOnlyIds: Set<ElementId> = new Set()
  ) {
    this.label = label;
  }

  do() {
    for (const node of this.nodes) {
      if (this.childOnlyIds.has(node.id)) {
        useSceneStore.getState().addElementOnly(node);
      } else {
        useSceneStore.getState().addElement(node, this.layerId);
      }
    }
  }

  undo() {
    for (const node of this.nodes) {
      useSceneStore.getState().removeElement(node.id);
    }
  }

  get pastedIds(): ElementId[] {
    return this.nodes.map((n) => n.id);
  }
}
