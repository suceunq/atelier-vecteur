import type { LayerId, SceneNode } from "../../scene/types";
import { useSceneStore } from "../sceneStore";
import type { Command } from "./Command";

export class AddElementCommand implements Command {
  label = "Ajouter une forme";

  constructor(
    private node: SceneNode,
    private layerId?: LayerId
  ) {}

  do() {
    useSceneStore.getState().addElement(this.node, this.layerId);
  }

  undo() {
    useSceneStore.getState().removeElement(this.node.id);
  }
}
