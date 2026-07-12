import { localBBox, localCenter, type BBox } from "../scene/geometry";
import type { EllipseNode, Point, PolygonNode, RectNode, SceneNode } from "../scene/types";
import { rotatePoint } from "../utils/matrix";

const MIN_SIZE = 1;
const MIN_SCALE = 0.01;

type Side = "zero" | "positive" | "fixed";
interface HandleSpec {
  x: Side;
  y: Side;
}

/** Which side of the shape's local bbox each handle drags, per axis. */
export const RESIZE_HANDLES: Record<string, HandleSpec> = {
  nw: { x: "zero", y: "zero" },
  n: { x: "fixed", y: "zero" },
  ne: { x: "positive", y: "zero" },
  e: { x: "positive", y: "fixed" },
  se: { x: "positive", y: "positive" },
  s: { x: "fixed", y: "positive" },
  sw: { x: "zero", y: "positive" },
  w: { x: "zero", y: "fixed" },
};

function opposite(side: Side): Side {
  if (side === "positive") return "zero";
  if (side === "zero") return "positive";
  return "fixed";
}

function cornerLocal(xSide: Side, ySide: Side, width: number, height: number): Point {
  return { x: xSide === "positive" ? width : 0, y: ySide === "positive" ? height : 0 };
}

export interface RectResizeState {
  anchorWorld: Point;
  rotation: number;
}

/** Captures the fixed anchor corner (world position) at the start of a rect resize drag. */
export function beginRectResize(node: RectNode, handle: string): RectResizeState {
  const spec = RESIZE_HANDLES[handle];
  const anchorSpec: HandleSpec = { x: opposite(spec.x), y: opposite(spec.y) };
  const anchorLocal = cornerLocal(anchorSpec.x, anchorSpec.y, node.width, node.height);
  const center = localCenter(node);
  const rotated = rotatePoint(anchorLocal, center, node.transform.rotation);
  const anchorWorld = { x: rotated.x + node.transform.x, y: rotated.y + node.transform.y };
  return { anchorWorld, rotation: node.transform.rotation };
}

/** Given the anchor captured at drag-start, computes the new width/height/x/y keeping the anchor corner fixed. */
export function applyRectResize(
  state: RectResizeState,
  handle: string,
  pointerWorld: Point
): { width: number; height: number; x: number; y: number } {
  const spec = RESIZE_HANDLES[handle];
  const anchorSpec: HandleSpec = { x: opposite(spec.x), y: opposite(spec.y) };

  const delta = { x: pointerWorld.x - state.anchorWorld.x, y: pointerWorld.y - state.anchorWorld.y };
  const vector = rotatePoint(delta, { x: 0, y: 0 }, -state.rotation);

  let width = 0;
  let height = 0;
  if (spec.x !== "fixed") width = Math.max(MIN_SIZE, spec.x === "positive" ? vector.x : -vector.x);
  if (spec.y !== "fixed") height = Math.max(MIN_SIZE, spec.y === "positive" ? vector.y : -vector.y);

  const anchorLocalNew = cornerLocal(anchorSpec.x, anchorSpec.y, width, height);
  const centerNew = { x: width / 2, y: height / 2 };
  const rotatedAnchorNew = rotatePoint(anchorLocalNew, centerNew, state.rotation);
  const x = state.anchorWorld.x - rotatedAnchorNew.x;
  const y = state.anchorWorld.y - rotatedAnchorNew.y;

  return { width, height, x, y };
}

/** Ellipse/polygon resize: local origin is already the center, so only rx/ry (or a uniform scale) change — no translate compensation needed. */
export function ellipseRadiiFromPointer(
  node: EllipseNode,
  pointerWorld: Point
): { rx: number; ry: number } {
  const center = { x: node.transform.x, y: node.transform.y };
  const delta = { x: pointerWorld.x - center.x, y: pointerWorld.y - center.y };
  const local = rotatePoint(delta, { x: 0, y: 0 }, -node.transform.rotation);
  return { rx: Math.max(MIN_SIZE, Math.abs(local.x)), ry: Math.max(MIN_SIZE, Math.abs(local.y)) };
}

export function polygonScaleFromPointer(
  node: PolygonNode,
  originalPoints: Point[],
  originalRadius: number,
  pointerWorld: Point
): Point[] {
  const center = { x: node.transform.x, y: node.transform.y };
  const delta = { x: pointerWorld.x - center.x, y: pointerWorld.y - center.y };
  const local = rotatePoint(delta, { x: 0, y: 0 }, -node.transform.rotation);
  const newRadius = Math.max(MIN_SIZE, Math.hypot(local.x, local.y));
  const scale = newRadius / originalRadius;
  return originalPoints.map((p) => ({ x: p.x * scale, y: p.y * scale }));
}

/**
 * Generic corner/edge-handle resize for node types whose geometry is fixed and only
 * `transform.scaleX`/`scaleY` change on resize (group, path, image, text) — as opposed to rect,
 * which instead grows its own `width`/`height` fields. Keeps the opposite corner/edge fixed in
 * world space, the same anchor-preserving approach as `beginRectResize`/`applyRectResize`, just
 * operating on scale factors instead of width/height.
 */
export interface ScaleResizeState {
  anchorWorld: Point;
  rotation: number;
  local: BBox;
  center: Point;
  startScaleX: number;
  startScaleY: number;
}

function localCorner(local: BBox, xSide: Side, ySide: Side): Point {
  return {
    x: xSide === "positive" ? local.x + local.width : local.x,
    y: ySide === "positive" ? local.y + local.height : local.y,
  };
}

function scaledRotatedCorner(local: BBox, center: Point, xSide: Side, ySide: Side, scaleX: number, scaleY: number, rotation: number): Point {
  const corner = localCorner(local, xSide, ySide);
  const scaledCorner = { x: corner.x * scaleX, y: corner.y * scaleY };
  const scaledCenter = { x: center.x * scaleX, y: center.y * scaleY };
  return rotatePoint(scaledCorner, scaledCenter, rotation);
}

export function beginScaleResize(node: SceneNode, handle: string): ScaleResizeState {
  const spec = RESIZE_HANDLES[handle];
  const anchorSpec: HandleSpec = { x: opposite(spec.x), y: opposite(spec.y) };
  const local = localBBox(node);
  const center = localCenter(node);
  const { rotation, x: tx, y: ty, scaleX, scaleY } = node.transform;
  const anchorRotated = scaledRotatedCorner(local, center, anchorSpec.x, anchorSpec.y, scaleX, scaleY, rotation);
  return {
    anchorWorld: { x: anchorRotated.x + tx, y: anchorRotated.y + ty },
    rotation,
    local,
    center,
    startScaleX: scaleX,
    startScaleY: scaleY,
  };
}

/** Given the anchor captured at drag-start, computes new scaleX/scaleY/x/y keeping the anchor corner fixed. */
export function applyScaleResize(
  state: ScaleResizeState,
  handle: string,
  pointerWorld: Point
): { scaleX: number; scaleY: number; x: number; y: number } {
  const spec = RESIZE_HANDLES[handle];
  const { local, center, rotation, anchorWorld, startScaleX, startScaleY } = state;

  const delta = { x: pointerWorld.x - anchorWorld.x, y: pointerWorld.y - anchorWorld.y };
  const vector = rotatePoint(delta, { x: 0, y: 0 }, -rotation);

  let scaleX = startScaleX;
  let scaleY = startScaleY;
  if (spec.x !== "fixed" && local.width > 0) {
    const scaledWidth = Math.max(MIN_SIZE, Math.abs(vector.x));
    scaleX = Math.max(MIN_SCALE, scaledWidth / local.width);
  }
  if (spec.y !== "fixed" && local.height > 0) {
    const scaledHeight = Math.max(MIN_SIZE, Math.abs(vector.y));
    scaleY = Math.max(MIN_SCALE, scaledHeight / local.height);
  }

  const anchorSpec: HandleSpec = { x: opposite(spec.x), y: opposite(spec.y) };
  const anchorRotatedNew = scaledRotatedCorner(local, center, anchorSpec.x, anchorSpec.y, scaleX, scaleY, rotation);
  const x = anchorWorld.x - anchorRotatedNew.x;
  const y = anchorWorld.y - anchorRotatedNew.y;

  return { scaleX, scaleY, x, y };
}
