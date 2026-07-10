import { createText } from "../scene/factory";
import { AddElementCommand } from "../store/commands/AddElementCommand";
import { useHistoryStore } from "../store/historyStore";
import { useSelectionStore } from "../store/selectionStore";
import { useTextEditStore } from "../store/textEditStore";
import { useToolStore } from "../store/toolStore";
import type { PointerInfo, Tool } from "./types";

/** Click to place a text node; editing itself happens via the TextEditOverlay HTML textarea. */
export class TextTool implements Tool {
  readonly id = "text";
  cursor = "text";

  onPointerDown(info: PointerInfo) {
    const node = createText(info.user.x, info.user.y);
    useHistoryStore.getState().execute(new AddElementCommand(node));
    useSelectionStore.getState().select([node.id]);
    useTextEditStore.getState().setEditingId(node.id);
    useToolStore.getState().setActiveTool("select");
  }

  onPointerMove() {}

  onPointerUp() {}
}
