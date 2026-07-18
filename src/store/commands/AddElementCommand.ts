import type { LayerId, SceneNode } from "../../scene/types";
import { useSceneStore } from "../sceneStore";
import type { Command } from "./Command";
import { t } from "../../i18n";

export class AddElementCommand implements Command {
  label = t("command.addElement");

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
