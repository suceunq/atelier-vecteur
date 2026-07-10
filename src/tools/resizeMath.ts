import { localCenter } from "../scene/geometry";
import type { EllipseNode, Point, PolygonNode, RectNode } from "../scene/types";
import { rotatePoint } from "../utils/matrix";

const MIN_SIZE = 1;

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
