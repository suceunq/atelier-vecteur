import type { ElementId, Transform } from "../../scene/types";
import { useSceneStore } from "../sceneStore";
import type { Command } from "./Command";
import { t } from "../../i18n";

/** Captures the before/after transform for one or more elements moved/resized/rotated together. */
export class TransformCommand implements Command {
  label = t("command.transform");

  constructor(
    private before: Record<ElementId, Transform>,
    private after: Record<ElementId, Transform>
  ) {}

  do() {
    for (const id of Object.keys(this.after)) {
      useSceneStore.getState().updateElementTransform(id, this.after[id]);
    }
  }

  undo() {
    for (const id of Object.keys(this.before)) {
      useSceneStore.getState().updateElementTransform(id, this.before[id]);
    }
  }
}
