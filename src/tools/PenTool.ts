import { createId } from "../scene/factory";
import { defaultStyle, defaultTransform, type PathAnchor, type PathNode, type Point } from "../scene/types";
import { AddElementCommand } from "../store/commands/AddElementCommand";
import { useDraftStore } from "../store/draftStore";
import { useHistoryStore } from "../store/historyStore";
import { useSelectionStore } from "../store/selectionStore";
import { useToolStore } from "../store/toolStore";
import type { PointerInfo, Tool } from "./types";

const CLOSE_DISTANCE_SCREEN = 10;
const MIN_DRAG_FOR_HANDLE = 0.5;

function buildPathNode(anchors: PathAnchor[], closed: boolean): PathNode {
  return {
    id: createId(),
    type: "path",
    transform: { ...defaultTransform },
    style: { ...defaultStyle, fill: closed ? defaultStyle.fill : "none" },
    nodes: anchors,
    closed,
  };
}

/** Bezier pen tool: click for a corner anchor, click-drag for a smooth anchor with mirrored handles. */
export class PenTool implements Tool {
  readonly id = "pen";
  cursor = "crosshair";

  private anchors: PathAnchor[] = [];
  private draggingIndex: number | null = null;

  private updateDraft(hover: Point | null) {
    if (this.anchors.length === 0) {
      useDraftStore.getState().setDraftNode(null);
      return;
    }
    const preview =
      hover && this.draggingIndex === null
        ? [...this.anchors, { id: "hover", anchor: hover, handleIn: null, handleOut: null, type: "corner" as const }]
        : this.anchors;
    useDraftStore.getState().setDraftNode(buildPathNode(preview, false));
  }

  onPointerDown(info: PointerInfo) {
    if (this.anchors.length >= 3) {
      const first = this.anchors[0];
      const screenDist = Math.hypot(
        (info.user.x - first.anchor.x) * info.viewport.zoom,
        (info.user.y - first.anchor.y) * info.viewport.zoom
      );
      if (screenDist <= CLOSE_DISTANCE_SCREEN) {
        this.finish(true);
        return;
      }
    }

    this.anchors.push({ id: createId(), anchor: info.user, handleIn: null, handleOut: null, type: "corner" });
    this.draggingIndex = this.anchors.length - 1;
    this.updateDraft(null);
  }

  onPointerMove(info: PointerInfo) {
    if (this.draggingIndex !== null) {
      const anchor = this.anchors[this.draggingIndex];
      const dx = info.user.x - anchor.anchor.x;
      const dy = info.user.y - anchor.anchor.y;
      if (Math.hypot(dx, dy) < MIN_DRAG_FOR_HANDLE) {
        anchor.handleOut = null;
        anchor.handleIn = null;
        anchor.type = "corner";
      } else {
        anchor.handleOut = { x: dx, y: dy };
        anchor.handleIn = info.altKey ? anchor.handleIn : { x: -dx, y: -dy };
        anchor.type = info.altKey ? "corner" : "smooth";
      }
      this.updateDraft(null);
      return;
    }

    if (this.anchors.length > 0) {
      this.updateDraft(info.user);
    }
  }

  onPointerUp() {
    this.draggingIndex = null;
  }

  onFinish() {
    if (this.anchors.length >= 2) {
      this.finish(false);
    } else {
      this.reset();
    }
  }

  onCancel() {
    this.reset();
  }

  private finish(closed: boolean) {
    if (this.anchors.length < 2) {
      this.reset();
      return;
    }
    const node = buildPathNode(this.anchors, closed);
    this.reset();
    useHistoryStore.getState().execute(new AddElementCommand(node));
    useSelectionStore.getState().select([node.id]);
    useToolStore.getState().setActiveTool("select");
  }

  private reset() {
    this.anchors = [];
    this.draggingIndex = null;
    useDraftStore.getState().setDraftNode(null);
  }
}
