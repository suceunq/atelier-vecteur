import { createEllipse } from "../scene/factory";
import type { Point } from "../scene/types";
import { AddElementCommand } from "../store/commands/AddElementCommand";
import { useDraftStore } from "../store/draftStore";
import { useHistoryStore } from "../store/historyStore";
import { rectFromDrag } from "./shapeGeometry";
import type { PointerInfo, Tool } from "./types";

function ellipseFromDrag(a: Point, b: Point, constrainCircle: boolean) {
  const { x, y, width, height } = rectFromDrag(a, b, constrainCircle);
  return {
    cx: x + width / 2,
    cy: y + height / 2,
    rx: width / 2,
    ry: height / 2,
  };
}

export class EllipseTool implements Tool {
  readonly id = "ellipse";
  cursor = "crosshair";
  private start: Point | null = null;

  onPointerDown(info: PointerInfo) {
    this.start = info.user;
    useDraftStore.getState().setDraftNode(createEllipse(info.user.x, info.user.y, 0, 0));
  }

  onPointerMove(info: PointerInfo) {
    if (!this.start) return;
    const { cx, cy, rx, ry } = ellipseFromDrag(this.start, info.user, info.shiftKey);
    useDraftStore.getState().setDraftNode(createEllipse(cx, cy, rx, ry));
  }

  onPointerUp(info: PointerInfo) {
    if (!this.start) return;
    const { cx, cy, rx, ry } = ellipseFromDrag(this.start, info.user, info.shiftKey);
    this.start = null;
    useDraftStore.getState().setDraftNode(null);
    if (rx < 1 || ry < 1) return;
    useHistoryStore.getState().execute(new AddElementCommand(createEllipse(cx, cy, rx, ry)));
  }

  onCancel() {
    this.start = null;
    useDraftStore.getState().setDraftNode(null);
  }
}
