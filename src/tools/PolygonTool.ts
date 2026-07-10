import { createRegularPolygon } from "../scene/factory";
import type { Point } from "../scene/types";
import { AddElementCommand } from "../store/commands/AddElementCommand";
import { useDraftStore } from "../store/draftStore";
import { useHistoryStore } from "../store/historyStore";
import type { PointerInfo, Tool } from "./types";

const DEFAULT_SIDES = 6;

export class PolygonTool implements Tool {
  readonly id = "polygon";
  cursor = "crosshair";
  private center: Point | null = null;

  onPointerDown(info: PointerInfo) {
    this.center = info.user;
    useDraftStore.getState().setDraftNode(createRegularPolygon(info.user.x, info.user.y, 0, DEFAULT_SIDES));
  }

  onPointerMove(info: PointerInfo) {
    if (!this.center) return;
    const radius = Math.hypot(info.user.x - this.center.x, info.user.y - this.center.y);
    useDraftStore
      .getState()
      .setDraftNode(createRegularPolygon(this.center.x, this.center.y, radius, DEFAULT_SIDES));
  }

  onPointerUp(info: PointerInfo) {
    if (!this.center) return;
    const radius = Math.hypot(info.user.x - this.center.x, info.user.y - this.center.y);
    const center = this.center;
    this.center = null;
    useDraftStore.getState().setDraftNode(null);
    if (radius < 1) return;
    useHistoryStore
      .getState()
      .execute(new AddElementCommand(createRegularPolygon(center.x, center.y, radius, DEFAULT_SIDES)));
  }

  onCancel() {
    this.center = null;
    useDraftStore.getState().setDraftNode(null);
  }
}
