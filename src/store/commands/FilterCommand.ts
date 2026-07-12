import type { Filter, FilterId } from "../../scene/types";
import { useSceneStore } from "../sceneStore";
import type { Command } from "./Command";

/** Snapshots a filter's full before/after state for undo (same pattern as GradientCommand). */
export class FilterCommand implements Command {
  label = "Modifier le filtre";

  constructor(
    private id: FilterId,
    private before: Filter,
    private after: Filter
  ) {}

  do() {
    useSceneStore.getState().updateFilter(this.id, this.after);
  }

  undo() {
    useSceneStore.getState().updateFilter(this.id, this.before);
  }
}
