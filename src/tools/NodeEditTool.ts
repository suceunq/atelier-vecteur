import { hitTestAtScreenPoint } from "../canvas/hitTest";
import { closestPointOnPath, pathSegments, subdivideCubic } from "../scene/bezier";
import { worldToLocal } from "../scene/geometry";
import { createId } from "../scene/factory";
import type { ElementId, PathAnchor, PathNode } from "../scene/types";
import { DeleteCommand } from "../store/commands/DeleteCommand";
import { PathEditCommand } from "../store/commands/PathEditCommand";
import { useHistoryStore } from "../store/historyStore";
import { useNodeEditStore } from "../store/nodeEditStore";
import { useSceneStore } from "../store/sceneStore";
import { useSelectionStore } from "../store/selectionStore";
import { useToolStore } from "../store/toolStore";
import type { PointerInfo, Tool } from "./types";

const INSERT_TOLERANCE_SCREEN = 8;

function cloneNode(node: PathNode): PathNode {
  return JSON.parse(JSON.stringify(node));
}

type DragKind = "anchor" | "handleIn" | "handleOut";

/** Node-level editing of a selected PathNode's anchors and bezier handles. Only meaningful with a single path selected. */
export class NodeEditTool implements Tool {
  readonly id = "nodeEdit";
  cursor = "default";

  private dragging: { kind: DragKind; index: number; before: PathNode } | null = null;

  private getPathId(): ElementId | null {
    const ids = useSelectionStore.getState().selectedIds;
    if (ids.length !== 1) return null;
    const node = useSceneStore.getState().scene.elements[ids[0]];
    return node?.type === "path" ? node.id : null;
  }

  private getPath(): PathNode | null {
    const id = this.getPathId();
    if (!id) return null;
    const node = useSceneStore.getState().scene.elements[id];
    return node?.type === "path" ? node : null;
  }

  onPointerDown(info: PointerInfo) {
    const path = this.getPath();
    if (!path) {
      useToolStore.getState().setActiveTool("select");
      return;
    }

    const hit = hitTestAtScreenPoint(info.screen.x, info.screen.y);
    if (hit.handle?.startsWith("node:")) {
      const index = Number(hit.handle.slice("node:".length));
      useNodeEditStore.getState().setSelectedAnchorIndex(index);
      if (info.altKey) {
        this.toggleAnchorType(index);
        return;
      }
      this.dragging = { kind: "anchor", index, before: cloneNode(path) };
      return;
    }
    if (hit.handle?.startsWith("handleIn:")) {
      const index = Number(hit.handle.slice("handleIn:".length));
      this.dragging = { kind: "handleIn", index, before: cloneNode(path) };
      return;
    }
    if (hit.handle?.startsWith("handleOut:")) {
      const index = Number(hit.handle.slice("handleOut:".length));
      this.dragging = { kind: "handleOut", index, before: cloneNode(path) };
      return;
    }

    useNodeEditStore.getState().setSelectedAnchorIndex(null);
    if (hit.elementId && hit.elementId !== path.id) {
      useSelectionStore.getState().select([hit.elementId]);
      useToolStore.getState().setActiveTool("select");
    }
  }

  onPointerMove(info: PointerInfo) {
    if (!this.dragging) return;
    const path = this.getPath();
    if (!path) return;

    const local = worldToLocal(path, info.user);
    const anchor = path.nodes[this.dragging.index];
    if (!anchor) return;

    if (this.dragging.kind === "anchor") {
      anchor.anchor = local;
    } else {
      const offset = { x: local.x - anchor.anchor.x, y: local.y - anchor.anchor.y };
      if (this.dragging.kind === "handleOut") {
        anchor.handleOut = offset;
        if (anchor.type === "smooth") anchor.handleIn = { x: -offset.x, y: -offset.y };
      } else {
        anchor.handleIn = offset;
        if (anchor.type === "smooth") anchor.handleOut = { x: -offset.x, y: -offset.y };
      }
    }

    useSceneStore.getState().updateElementGeometry(path.id, { nodes: [...path.nodes] });
  }

  onPointerUp() {
    if (this.dragging) {
      const path = this.getPath();
      if (path) {
        useHistoryStore.getState().execute(new PathEditCommand(path.id, this.dragging.before, cloneNode(path)));
      }
      this.dragging = null;
    }
  }

  onDoubleClick(info: PointerInfo) {
    const path = this.getPath();
    if (!path) return;

    const hit = hitTestAtScreenPoint(info.screen.x, info.screen.y);
    if (hit.handle) return; // double-click on an existing anchor/handle: not a segment insert

    const local = worldToLocal(path, info.user);
    const closest = closestPointOnPath(path, local);
    if (!closest) return;

    const toleranceLocal = INSERT_TOLERANCE_SCREEN / info.viewport.zoom;
    if (closest.distance > toleranceLocal) return;

    const before = cloneNode(path);
    const segments = pathSegments(path);
    const segment = segments.find((s) => s.startIndex === closest.segmentIndex);
    if (!segment) return;

    const { left, right } = subdivideCubic(segment.p0, segment.p1, segment.p2, segment.p3, closest.t);
    const [, q1, q2, splitPoint] = left;
    const [, r1, r2] = right;

    const count = path.nodes.length;
    const startAnchor = path.nodes[segment.startIndex];
    const endAnchor = path.nodes[(segment.startIndex + 1) % count];

    if (!segment.isLine) {
      startAnchor.handleOut = { x: q1.x - startAnchor.anchor.x, y: q1.y - startAnchor.anchor.y };
      endAnchor.handleIn = { x: r2.x - endAnchor.anchor.x, y: r2.y - endAnchor.anchor.y };
    }

    const newAnchor: PathAnchor = {
      id: createId(),
      anchor: splitPoint,
      handleIn: segment.isLine ? null : { x: q2.x - splitPoint.x, y: q2.y - splitPoint.y },
      handleOut: segment.isLine ? null : { x: r1.x - splitPoint.x, y: r1.y - splitPoint.y },
      type: "corner",
    };

    const nodes = [...path.nodes];
    nodes.splice(segment.startIndex + 1, 0, newAnchor);
    useSceneStore.getState().updateElementGeometry(path.id, { nodes });

    const after = useSceneStore.getState().scene.elements[path.id];
    if (after?.type === "path") {
      useHistoryStore.getState().execute(new PathEditCommand(path.id, before, cloneNode(after)));
    }
  }

  /** Alt+click on an anchor toggles corner <-> smooth (wired from the app's Alt+click handling via SelectTool passthrough is not needed — handled here since NodeEditTool owns pointerdown while active). */
  toggleAnchorType(index: number) {
    const path = this.getPath();
    if (!path) return;
    const anchor = path.nodes[index];
    if (!anchor) return;
    const before = cloneNode(path);

    anchor.type = anchor.type === "smooth" ? "corner" : "smooth";
    if (anchor.type === "smooth") {
      if (anchor.handleOut && !anchor.handleIn) {
        anchor.handleIn = { x: -anchor.handleOut.x, y: -anchor.handleOut.y };
      } else if (anchor.handleIn && !anchor.handleOut) {
        anchor.handleOut = { x: -anchor.handleIn.x, y: -anchor.handleIn.y };
      } else if (anchor.handleIn) {
        anchor.handleOut = { x: -anchor.handleIn.x, y: -anchor.handleIn.y };
      }
    }

    useSceneStore.getState().updateElementGeometry(path.id, { nodes: [...path.nodes] });
    const after = useSceneStore.getState().scene.elements[path.id];
    if (after?.type === "path") {
      useHistoryStore.getState().execute(new PathEditCommand(path.id, before, cloneNode(after)));
    }
  }

  deleteSelectedAnchor() {
    const path = this.getPath();
    const selectedAnchorIndex = useNodeEditStore.getState().selectedAnchorIndex;
    if (!path || selectedAnchorIndex === null) return;

    if (path.nodes.length <= 2) {
      useHistoryStore.getState().execute(new DeleteCommand([path.id]));
      useSelectionStore.getState().clear();
      useToolStore.getState().setActiveTool("select");
      return;
    }

    const before = cloneNode(path);
    const nodes = path.nodes.filter((_, i) => i !== selectedAnchorIndex);
    useNodeEditStore.getState().setSelectedAnchorIndex(null);
    useSceneStore.getState().updateElementGeometry(path.id, { nodes });
    const after = useSceneStore.getState().scene.elements[path.id];
    if (after?.type === "path") {
      useHistoryStore.getState().execute(new PathEditCommand(path.id, before, cloneNode(after)));
    }
  }

  onCancel() {
    this.dragging = null;
    useNodeEditStore.getState().setSelectedAnchorIndex(null);
    useToolStore.getState().setActiveTool("select");
  }
}
