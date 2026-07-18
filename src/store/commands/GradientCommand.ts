import type { Gradient, GradientId } from "../../scene/types";
import { useSceneStore } from "../sceneStore";
import type { Command } from "./Command";
import { t } from "../../i18n";

/** Snapshots a gradient's full before/after state (stops, endpoints, kind) for undo. */
export class GradientCommand implements Command {
  label = t("command.gradient");

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
