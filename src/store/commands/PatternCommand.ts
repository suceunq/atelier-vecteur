import type { Pattern, PatternId } from "../../scene/types";
import { useSceneStore } from "../sceneStore";
import type { Command } from "./Command";
import { t } from "../../i18n";

/** Snapshots a pattern's full before/after state for undo (same pattern as GradientCommand/FilterCommand). */
export class PatternCommand implements Command {
  label = t("command.pattern");

  constructor(
    private id: PatternId,
    private before: Pattern,
    private after: Pattern
  ) {}

  do() {
    useSceneStore.getState().updatePattern(this.id, this.after);
  }

  undo() {
    useSceneStore.getState().updatePattern(this.id, this.before);
  }
}
