import type { ElementId, PathNode } from "../../scene/types";
import { useSceneStore } from "../sceneStore";
import type { Command } from "./Command";
import { t } from "../../i18n";

/** Snapshots the full path before/after a node-edit gesture (move anchor/handle, insert/delete node, convert type). */
export class PathEditCommand implements Command {
  label = t("command.path");

  constructor(
    private id: ElementId,
    private before: PathNode,
    private after: PathNode
  ) {}

  do() {
    useSceneStore.getState().updateElementGeometry(this.id, this.after as unknown as Record<string, unknown>);
  }

  undo() {
    useSceneStore.getState().updateElementGeometry(this.id, this.before as unknown as Record<string, unknown>);
  }
}
