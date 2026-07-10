import { createLine } from "../scene/factory";
import type { Point } from "../scene/types";
import { snapAngle } from "../utils/matrix";
import { AddElementCommand } from "../store/commands/AddElementCommand";
import { useDraftStore } from "../store/draftStore";
import { useHistoryStore } from "../store/historyStore";
import type { PointerInfo, Tool } from "./types";

function endPoint(start: Point, current: Point, constrainAngle: boolean): Point {
  if (!constrainAngle) return current;
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  const length = Math.hypot(dx, dy);
  const angleDeg = snapAngle((Math.atan2(dy, dx) * 180) / Math.PI, 45);
  const rad = (angleDeg * Math.PI) / 180;
  return { x: start.x + Math.cos(rad) * length, y: start.y + Math.sin(rad) * length };
}

export class LineTool implements Tool {
  readonly id = "line";
  cursor = "crosshair";
  private start: Point | null = null;

  onPointerDown(info: PointerInfo) {
    this.start = info.user;
    useDraftStore.getState().setDraftNode(createLine(info.user.x, info.user.y, info.user.x, info.user.y));
  }

  onPointerMove(info: PointerInfo) {
    if (!this.start) return;
    const end = endPoint(this.start, info.user, info.shiftKey);
    useDraftStore.getState().setDraftNode(createLine(this.start.x, this.start.y, end.x, end.y));
  }

  onPointerUp(info: PointerInfo) {
    if (!this.start) return;
    const end = endPoint(this.start, info.user, info.shiftKey);
    const start = this.start;
    this.start = null;
    useDraftStore.getState().setDraftNode(null);
    if (Math.hypot(end.x - start.x, end.y - start.y) < 1) return;
    useHistoryStore.getState().execute(new AddElementCommand(createLine(start.x, start.y, end.x, end.y)));
  }

  onCancel() {
    this.start = null;
    useDraftStore.getState().setDraftNode(null);
  }
}
