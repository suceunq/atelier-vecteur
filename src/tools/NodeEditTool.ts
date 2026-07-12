import { hitTestAtScreenPoint } from "../canvas/hitTest";
import { closestPointOnPath, pathSegments, subdivideCubic } from "../scene/bezier";
import { worldToLocal } from "../scene/geometry";
import { createId } from "../scene/factory";
import type { ElementId, PathAnchor, PathNode } from "../scene/types";
import { DeleteCommand } from "../store/commands/DeleteCommand";
import { PathEditCommand } from "../store/commands/PathEditCommand";
import { useHistoryStore } from "../store/historyStore";
import { useNodeEditStore, type AnchorRef } from "../store/nodeEditStore";
import { useSceneStore } from "../store/sceneStore";
import { useSelectionStore } from "../store/selectionStore";
import { useToolStore } from "../store/toolStore";
import type { PointerInfo, Tool } from "./types";

const INSERT_TOLERANCE_SCREEN = 8;

function cloneNode(node: PathNode): PathNode {
  return JSON.parse(JSON.stringify(node));
}

/** Parses a `node:{subpathIndex}:{anchorIndex}` / `handleIn:...` / `handleOut:...` handle id. */
function parseAnchorHandle(handle: string, prefix: string): AnchorRef | null {
  if (!handle.startsWith(`${prefix}:`)) return null;
  const [subpathIndex, anchorIndex] = handle
    .slice(prefix.length + 1)
    .split(":")
    .map(Number);
  if (Number.isNaN(subpathIndex) || Number.isNaN(anchorIndex)) return null;
  return { subpathIndex, anchorIndex };
}

type DragKind = "anchor" | "handleIn" | "handleOut";

/** Node-level editing of a selected PathNode's anchors and bezier handles. Only meaningful with a single path selected. */
export class NodeEditTool implements Tool {
  readonly id = "nodeEdit";
  cursor = "default";

  private dragging: { kind: DragKind; ref: AnchorRef; before: PathNode } | null = null;

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
    const nodeRef = hit.handle && parseAnchorHandle(hit.handle, "node");
    if (nodeRef) {
      useNodeEditStore.getState().setSelectedAnchor(nodeRef);
      if (info.altKey) {
        this.toggleAnchorType(nodeRef);
        return;
      }
      this.dragging = { kind: "anchor", ref: nodeRef, before: cloneNode(path) };
      return;
    }
    const handleInRef = hit.handle && parseAnchorHandle(hit.handle, "handleIn");
    if (handleInRef) {
      this.dragging = { kind: "handleIn", ref: handleInRef, before: cloneNode(path) };
      return;
    }
    const handleOutRef = hit.handle && parseAnchorHandle(hit.handle, "handleOut");
    if (handleOutRef) {
      this.dragging = { kind: "handleOut", ref: handleOutRef, before: cloneNode(path) };
      return;
    }

    useNodeEditStore.getState().setSelectedAnchor(null);
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
    const subpath = path.subpaths[this.dragging.ref.subpathIndex];
    const anchor = subpath?.nodes[this.dragging.ref.anchorIndex];
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

    useSceneStore.getState().updateElementGeometry(path.id, { subpaths: [...path.subpaths] });
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
    const segment = segments.find(
      (s) => s.subpathIndex === closest.subpathIndex && s.startIndex === closest.segmentIndex
    );
    if (!segment) return;

    const { left, right } = subdivideCubic(segment.p0, segment.p1, segment.p2, segment.p3, closest.t);
    const [, q1, q2, splitPoint] = left;
    const [, r1, r2] = right;

    const subpath = path.subpaths[closest.subpathIndex];
    const count = subpath.nodes.length;
    const startAnchor = subpath.nodes[segment.startIndex];
    const endAnchor = subpath.nodes[(segment.startIndex + 1) % count];

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

    const nodes = [...subpath.nodes];
    nodes.splice(segment.startIndex + 1, 0, newAnchor);
    const subpaths = path.subpaths.map((sp, i) => (i === closest.subpathIndex ? { ...sp, nodes } : sp));
    useSceneStore.getState().updateElementGeometry(path.id, { subpaths });

    const after = useSceneStore.getState().scene.elements[path.id];
    if (after?.type === "path") {
      useHistoryStore.getState().execute(new PathEditCommand(path.id, before, cloneNode(after)));
    }
  }

  /** Alt+click on an anchor toggles corner <-> smooth. */
  toggleAnchorType(ref: AnchorRef) {
    const path = this.getPath();
    if (!path) return;
    const subpath = path.subpaths[ref.subpathIndex];
    const anchor = subpath?.nodes[ref.anchorIndex];
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

    useSceneStore.getState().updateElementGeometry(path.id, { subpaths: [...path.subpaths] });
    const after = useSceneStore.getState().scene.elements[path.id];
    if (after?.type === "path") {
      useHistoryStore.getState().execute(new PathEditCommand(path.id, before, cloneNode(after)));
    }
  }

  deleteSelectedAnchor() {
    const path = this.getPath();
    const ref = useNodeEditStore.getState().selectedAnchor;
    if (!path || !ref) return;
    const subpath = path.subpaths[ref.subpathIndex];
    if (!subpath) return;

    if (subpath.nodes.length <= 2) {
      // Removing this subpath's near-degenerate remainder: drop the whole subpath, or the whole
      // path if it was the only one.
      if (path.subpaths.length <= 1) {
        useHistoryStore.getState().execute(new DeleteCommand([path.id]));
        useSelectionStore.getState().clear();
        useToolStore.getState().setActiveTool("select");
        return;
      }
      const before = cloneNode(path);
      const subpaths = path.subpaths.filter((_, i) => i !== ref.subpathIndex);
      useNodeEditStore.getState().setSelectedAnchor(null);
      useSceneStore.getState().updateElementGeometry(path.id, { subpaths });
      const after = useSceneStore.getState().scene.elements[path.id];
      if (after?.type === "path") {
        useHistoryStore.getState().execute(new PathEditCommand(path.id, before, cloneNode(after)));
      }
      return;
    }

    const before = cloneNode(path);
    const nodes = subpath.nodes.filter((_, i) => i !== ref.anchorIndex);
    const subpaths = path.subpaths.map((sp, i) => (i === ref.subpathIndex ? { ...sp, nodes } : sp));
    useNodeEditStore.getState().setSelectedAnchor(null);
    useSceneStore.getState().updateElementGeometry(path.id, { subpaths });
    const after = useSceneStore.getState().scene.elements[path.id];
    if (after?.type === "path") {
      useHistoryStore.getState().execute(new PathEditCommand(path.id, before, cloneNode(after)));
    }
  }

  onCancel() {
    this.dragging = null;
    useNodeEditStore.getState().setSelectedAnchor(null);
    useToolStore.getState().setActiveTool("select");
  }
}
