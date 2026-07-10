import { createRect } from "../scene/factory";
import type { Point } from "../scene/types";
import { AddElementCommand } from "../store/commands/AddElementCommand";
import { useDraftStore } from "../store/draftStore";
import { useHistoryStore } from "../store/historyStore";
import { rectFromDrag } from "./shapeGeometry";
import type { PointerInfo, Tool } from "./types";

export class RectTool implements Tool {
  readonly id = "rect";
  cursor = "crosshair";
  private start: Point | null = null;

  onPointerDown(info: PointerInfo) {
    this.start = info.user;
    useDraftStore.getState().setDraftNode(createRect(info.user.x, info.user.y, 0, 0));
  }

  onPointerMove(info: PointerInfo) {
    if (!this.start) return;
    const { x, y, width, height } = rectFromDrag(this.start, info.user, info.shiftKey);
    useDraftStore.getState().setDraftNode(createRect(x, y, width, height));
  }

  onPointerUp(info: PointerInfo) {
    if (!this.start) return;
    const { x, y, width, height } = rectFromDrag(this.start, info.user, info.shiftKey);
    this.start = null;
    useDraftStore.getState().setDraftNode(null);
    if (width < 1 || height < 1) return;
    useHistoryStore.getState().execute(new AddElementCommand(createRect(x, y, width, height)));
  }

  onCancel() {
    this.start = null;
    useDraftStore.getState().setDraftNode(null);
  }
}
