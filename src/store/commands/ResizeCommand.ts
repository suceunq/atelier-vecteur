import type { ElementId, SceneNode } from "../../scene/types";
import { useSceneStore } from "../sceneStore";
import type { Command } from "./Command";

type GeometryPatch = Partial<SceneNode>;

/** Captures before/after transform + shape-specific dimensions (width/height/rx/ry/points/x2/y2) for a resize gesture. */
export class ResizeCommand implements Command {
  label = "Redimensionner";

  constructor(
    private id: ElementId,
    private before: GeometryPatch,
    private after: GeometryPatch
  ) {}

  do() {
    useSceneStore.getState().updateElementGeometry(this.id, this.after as Record<string, unknown>);
  }

  undo() {
    useSceneStore.getState().updateElementGeometry(this.id, this.before as Record<string, unknown>);
  }
}
