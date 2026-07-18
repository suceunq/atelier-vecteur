import type { LayerId, PathNode, TextNode } from "../../scene/types";
import { useSceneStore } from "../sceneStore";
import type { Command } from "./Command";
import { t } from "../../i18n";

/** Replaces a TextNode with a PathNode (text-to-path conversion) — undo restores the original editable text. */
export class ConvertTextToPathCommand implements Command {
  label = t("command.textToPath");

  constructor(
    private textNode: TextNode,
    private pathNode: PathNode,
    private layerId?: LayerId
  ) {}

  do() {
    useSceneStore.getState().removeElement(this.textNode.id);
    useSceneStore.getState().addElement(this.pathNode, this.layerId);
  }

  undo() {
    useSceneStore.getState().removeElement(this.pathNode.id);
    useSceneStore.getState().addElement(this.textNode, this.layerId);
  }
}
