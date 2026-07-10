import type { Command } from "./Command";

/** Wraps a pair of do/undo closures as a Command — used for one-off actions (layer ops, etc.) that don't warrant their own class. */
export class GenericCommand implements Command {
  constructor(
    public label: string,
    private onDo: () => void,
    private onUndo: () => void
  ) {}

  do() {
    this.onDo();
  }

  undo() {
    this.onUndo();
  }
}
