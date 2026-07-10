import { hitTestAtScreenPoint } from "../canvas/hitTest";
import { bboxIntersects, localCenter, worldBBox, worldToLocal } from "../scene/geometry";
import { gradientIdFromRef, isGradientRef, type ElementId, type Gradient, type SceneNode, type Transform } from "../scene/types";
import { angleFromCenter, snapAngle } from "../utils/matrix";
import { GradientCommand } from "../store/commands/GradientCommand";
import { ResizeCommand } from "../store/commands/ResizeCommand";
import { TransformCommand } from "../store/commands/TransformCommand";
import { useDraftStore } from "../store/draftStore";
import { useHistoryStore } from "../store/historyStore";
import { useSceneStore } from "../store/sceneStore";
import { useSelectionStore } from "../store/selectionStore";
import { useTextEditStore } from "../store/textEditStore";
import { useToolStore } from "../store/toolStore";
import {
  applyRectResize,
  beginRectResize,
  ellipseRadiiFromPointer,
  polygonScaleFromPointer,
  type RectResizeState,
} from "./resizeMath";
import type { PointerInfo, Tool } from "./types";

type Mode = "idle" | "moving" | "resizing" | "rotating" | "marquee" | "gradientDrag";

function cloneNode(node: SceneNode): SceneNode {
  return JSON.parse(JSON.stringify(node));
}

export class SelectTool implements Tool {
  readonly id = "select";
  cursor = "default";

  private mode: Mode = "idle";
  private moved = false;

  // move
  private pointerStart = { x: 0, y: 0 };
  private moveBefore: Record<ElementId, Transform> = {};

  // resize
  private resizeId: ElementId | null = null;
  private resizeHandle: string | null = null;
  private resizeBeforeNode: SceneNode | null = null;
  private rectResizeState: RectResizeState | null = null;
  private polygonDragRadius = 0;

  // rotate
  private rotateId: ElementId | null = null;
  private rotateBefore: Transform | null = null;

  // gradient handle drag
  private gradientDragKind: "from" | "to" | null = null;
  private gradientDragId: string | null = null;
  private gradientDragNodeId: ElementId | null = null;
  private gradientBefore: Gradient | null = null;

  // marquee
  private marqueeStart = { x: 0, y: 0 };
  private marqueeAdditive = false;

  onPointerDown(info: PointerInfo) {
    const hit = hitTestAtScreenPoint(info.screen.x, info.screen.y);
    const selection = useSelectionStore.getState();

    if (hit.handle && selection.selectedIds.length === 1) {
      this.beginHandleDrag(hit.handle, selection.selectedIds[0]);
      return;
    }

    if (hit.elementId) {
      const alreadySelected = selection.isSelected(hit.elementId);
      if (info.shiftKey) {
        selection.toggle(hit.elementId);
      } else if (!alreadySelected) {
        selection.select([hit.elementId]);
      }
      this.beginMove(info);
      return;
    }

    this.mode = "marquee";
    this.marqueeAdditive = info.shiftKey;
    this.marqueeStart = info.user;
    if (!info.shiftKey) selection.clear();
  }

  private beginMove(info: PointerInfo) {
    this.mode = "moving";
    this.moved = false;
    this.pointerStart = info.user;
    const { scene } = useSceneStore.getState();
    this.moveBefore = {};
    for (const id of useSelectionStore.getState().selectedIds) {
      const node = scene.elements[id];
      if (node) this.moveBefore[id] = { ...node.transform };
    }
  }

  private beginHandleDrag(handle: string, id: ElementId) {
    const node = useSceneStore.getState().scene.elements[id];
    if (!node) return;

    if (handle === "rotate") {
      this.mode = "rotating";
      this.rotateId = id;
      this.rotateBefore = { ...node.transform };
      return;
    }

    if (handle === "gradient-from" || handle === "gradient-to") {
      if (!isGradientRef(node.style.fill)) return;
      const gradientId = gradientIdFromRef(node.style.fill);
      const gradient = useSceneStore.getState().scene.gradients[gradientId];
      if (!gradient) return;
      this.mode = "gradientDrag";
      this.gradientDragKind = handle === "gradient-from" ? "from" : "to";
      this.gradientDragId = gradientId;
      this.gradientDragNodeId = id;
      this.gradientBefore = { ...gradient, stops: gradient.stops.map((s) => ({ ...s })) };
      return;
    }

    this.mode = "resizing";
    this.resizeId = id;
    this.resizeHandle = handle;
    this.resizeBeforeNode = cloneNode(node);

    if (node.type === "rect") {
      this.rectResizeState = beginRectResize(node, handle);
    } else if (node.type === "polygon") {
      this.polygonDragRadius = Math.hypot(node.points[0]?.x ?? 0, node.points[0]?.y ?? 0) || 1;
    }
  }

  onPointerMove(info: PointerInfo) {
    switch (this.mode) {
      case "moving":
        this.updateMove(info);
        break;
      case "resizing":
        this.updateResize(info);
        break;
      case "rotating":
        this.updateRotate(info);
        break;
      case "marquee":
        this.updateMarquee(info);
        break;
      case "gradientDrag":
        this.updateGradientDrag(info);
        break;
    }
  }

  private updateGradientDrag(info: PointerInfo) {
    if (!this.gradientDragId || !this.gradientDragNodeId || !this.gradientDragKind) return;
    const node = useSceneStore.getState().scene.elements[this.gradientDragNodeId];
    if (!node) return;
    const local = worldToLocal(node, info.user);
    const patch = this.gradientDragKind === "from" ? { from: local } : { to: local };
    useSceneStore.getState().updateGradient(this.gradientDragId, patch);
  }

  private updateMove(info: PointerInfo) {
    const dx = info.user.x - this.pointerStart.x;
    const dy = info.user.y - this.pointerStart.y;
    if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) this.moved = true;
    const store = useSceneStore.getState();
    for (const id of Object.keys(this.moveBefore)) {
      const before = this.moveBefore[id];
      store.updateElementTransform(id, { x: before.x + dx, y: before.y + dy });
    }
  }

  private updateResize(info: PointerInfo) {
    if (!this.resizeId || !this.resizeHandle) return;
    const store = useSceneStore.getState();
    const node = store.scene.elements[this.resizeId];
    if (!node) return;

    if (node.type === "rect" && this.rectResizeState) {
      const { width, height, x, y } = applyRectResize(this.rectResizeState, this.resizeHandle, info.user);
      store.updateElementGeometry(this.resizeId, { width, height, transform: { ...node.transform, x, y } });
    } else if (node.type === "ellipse") {
      const { rx, ry } = ellipseRadiiFromPointer(node, info.user);
      store.updateElementGeometry(this.resizeId, { rx, ry });
    } else if (node.type === "polygon" && this.resizeBeforeNode?.type === "polygon") {
      const points = polygonScaleFromPointer(
        node,
        this.resizeBeforeNode.points,
        this.polygonDragRadius,
        info.user
      );
      store.updateElementGeometry(this.resizeId, { points });
    } else if (node.type === "line") {
      if (this.resizeHandle === "end") {
        store.updateElementGeometry(this.resizeId, {
          x2: info.user.x - node.transform.x,
          y2: info.user.y - node.transform.y,
        });
      } else if (this.resizeHandle === "start") {
        const endWorld = { x: node.transform.x + node.x2, y: node.transform.y + node.y2 };
        store.updateElementGeometry(this.resizeId, {
          transform: { ...node.transform, x: info.user.x, y: info.user.y },
          x2: endWorld.x - info.user.x,
          y2: endWorld.y - info.user.y,
        });
      }
    }
  }

  private updateRotate(info: PointerInfo) {
    if (!this.rotateId) return;
    const store = useSceneStore.getState();
    const node = store.scene.elements[this.rotateId];
    if (!node) return;
    const center = localCenter(node);
    const worldCenter = { x: node.transform.x + center.x, y: node.transform.y + center.y };
    let angle = angleFromCenter(worldCenter, info.user);
    if (info.shiftKey) angle = snapAngle(angle, 15);
    store.updateElementTransform(this.rotateId, { rotation: angle });
  }

  private updateMarquee(info: PointerInfo) {
    const x = Math.min(this.marqueeStart.x, info.user.x);
    const y = Math.min(this.marqueeStart.y, info.user.y);
    const width = Math.abs(info.user.x - this.marqueeStart.x);
    const height = Math.abs(info.user.y - this.marqueeStart.y);
    useDraftStore.getState().setMarquee({ x, y, width, height });
  }

  onPointerUp(_info: PointerInfo) {
    switch (this.mode) {
      case "moving":
        this.finishMove();
        break;
      case "resizing":
        this.finishResize();
        break;
      case "rotating":
        this.finishRotate();
        break;
      case "marquee":
        this.finishMarquee();
        break;
      case "gradientDrag":
        this.finishGradientDrag();
        break;
    }
    this.mode = "idle";
  }

  private finishGradientDrag() {
    if (this.gradientDragId && this.gradientBefore) {
      const gradient = useSceneStore.getState().scene.gradients[this.gradientDragId];
      if (gradient) {
        useHistoryStore.getState().execute(new GradientCommand(this.gradientDragId, this.gradientBefore, gradient));
      }
    }
    this.gradientDragKind = null;
    this.gradientDragId = null;
    this.gradientDragNodeId = null;
    this.gradientBefore = null;
  }

  private finishMove() {
    if (this.moved) {
      const store = useSceneStore.getState();
      const after: Record<ElementId, Transform> = {};
      for (const id of Object.keys(this.moveBefore)) {
        const node = store.scene.elements[id];
        if (node) after[id] = { ...node.transform };
      }
      useHistoryStore.getState().execute(new TransformCommand(this.moveBefore, after));
    }
    this.moveBefore = {};
  }

  private finishResize() {
    if (this.resizeId && this.resizeBeforeNode) {
      const store = useSceneStore.getState();
      const node = store.scene.elements[this.resizeId];
      if (node) {
        useHistoryStore.getState().execute(new ResizeCommand(this.resizeId, this.resizeBeforeNode, cloneNode(node)));
      }
    }
    this.resizeId = null;
    this.resizeHandle = null;
    this.resizeBeforeNode = null;
    this.rectResizeState = null;
  }

  private finishRotate() {
    if (this.rotateId && this.rotateBefore) {
      const store = useSceneStore.getState();
      const node = store.scene.elements[this.rotateId];
      if (node && node.transform.rotation !== this.rotateBefore.rotation) {
        useHistoryStore
          .getState()
          .execute(new TransformCommand({ [this.rotateId]: this.rotateBefore }, { [this.rotateId]: { ...node.transform } }));
      }
    }
    this.rotateId = null;
    this.rotateBefore = null;
  }

  private finishMarquee() {
    const marquee = useDraftStore.getState().marquee;
    useDraftStore.getState().setMarquee(null);
    if (!marquee) return;

    const { scene } = useSceneStore.getState();
    const hits: ElementId[] = [];
    for (const layer of scene.layers) {
      if (!layer.visible || layer.locked) continue;
      for (const id of layer.elementIds) {
        const node = scene.elements[id];
        if (node && bboxIntersects(worldBBox(node), marquee)) hits.push(id);
      }
    }

    const selection = useSelectionStore.getState();
    if (this.marqueeAdditive) {
      selection.addToSelection(hits);
    } else {
      selection.select(hits);
    }
  }

  onCancel() {
    this.mode = "idle";
    useDraftStore.getState().setMarquee(null);
  }

  onDoubleClick(info: PointerInfo) {
    const hit = hitTestAtScreenPoint(info.screen.x, info.screen.y);
    if (!hit.elementId) return;
    const node = useSceneStore.getState().scene.elements[hit.elementId];
    if (!node) return;

    if (node.type === "path") {
      useSelectionStore.getState().select([node.id]);
      useToolStore.getState().setActiveTool("nodeEdit");
    } else if (node.type === "text") {
      useSelectionStore.getState().select([node.id]);
      useTextEditStore.getState().setEditingId(node.id);
    }
  }
}
