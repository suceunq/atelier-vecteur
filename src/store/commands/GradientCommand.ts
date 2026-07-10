import type { Gradient, GradientId } from "../../scene/types";
import { useSceneStore } from "../sceneStore";
import type { Command } from "./Command";

/** Snapshots a gradient's full before/after state (stops, endpoints, kind) for undo. */
export class GradientCommand implements Command {
  label = "Modifier le dégradé";

  constructor(
    private id: GradientId,
    private before: Gradient,
    private after: Gradient
  ) {}

  do() {
    useSceneStore.getState().updateGradient(this.id, this.after);
  }

  undo() {
    useSceneStore.getState().updateGradient(this.id, this.before);
  }
}
