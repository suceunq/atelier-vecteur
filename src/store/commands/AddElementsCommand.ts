import type { ElementId, LayerId, SceneNode } from "../../scene/types";
import { useSceneStore } from "../sceneStore";
import type { Command } from "./Command";

/** Adds multiple elements as a single undo step — used for paste/duplicate. */
export class AddElementsCommand implements Command {
  label = "Coller";

  constructor(private nodes: SceneNode[], private layerId?: LayerId) {}

  do() {
    for (const node of this.nodes) {
      useSceneStore.getState().addElement(node, this.layerId);
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
