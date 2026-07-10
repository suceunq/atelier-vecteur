import type { ElementId, Style } from "../../scene/types";
import { useSceneStore } from "../sceneStore";
import type { Command } from "./Command";

export class StyleChangeCommand implements Command {
  label = "Modifier le style";

  constructor(
    private before: Record<ElementId, Partial<Style>>,
    private after: Partial<Style>
  ) {}

  do() {
    for (const id of Object.keys(this.before)) {
      useSceneStore.getState().updateElementStyle(id, this.after);
    }
  }

  undo() {
    for (const id of Object.keys(this.before)) {
      useSceneStore.getState().updateElementStyle(id, this.before[id]);
    }
  }
}
