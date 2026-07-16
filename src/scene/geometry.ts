import { controlPolygonBBox } from "./bezier";
import { safeNumber } from "./sanitize";
import { rotatePoint } from "../utils/matrix";
import type { Point, Scene, SceneNode } from "./types";

/** Rough width-per-character factor for the approximate text bbox (no DOM measurement available in pure geometry code). */
const TEXT_CHAR_WIDTH_FACTOR = 0.56;

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Bounding box of the shape in its own local, untransformed coordinate space. */
export function localBBox(node: SceneNode): BBox {
  switch (node.type) {
    case "rect":
      return { x: 0, y: 0, width: node.width, height: node.height };
    case "ellipse":
      return { x: -node.rx, y: -node.ry, width: node.rx * 2, height: node.ry * 2 };
    case "line": {
      const minX = Math.min(0, node.x2);
      const minY = Math.min(0, node.y2);
      return {
        x: minX,
        y: minY,
        width: Math.abs(node.x2) || 0.0001,
        height: Math.abs(node.y2) || 0.0001,
      };
    }
    case "polygon": {
      const xs = node.points.map((p) => p.x);
      const ys = node.points.map((p) => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    case "path":
      return controlPolygonBBox(node.subpaths);
    case "group":
      return { ...node.bounds };
    case "image":
      return { x: 0, y: 0, width: node.width, height: node.height };
    case "text": {
      // Approximation: no DOM measurement available in this pure-data module. Rendering itself
      // (a real <text> element) is pixel-perfect; this only sizes selection handles/marquee hits.
      const width = Math.max(1, node.content.length * node.fontSize * TEXT_CHAR_WIDTH_FACTOR);
      const height = node.fontSize * 1.2;
      const x = node.textAnchor === "start" ? 0 : node.textAnchor === "end" ? -width : -width / 2;
      return { x, y: -node.fontSize * 0.8, width, height };
    }
  }
}

/** Center of the shape's local bounding box — the pivot used for rotation. */
export function localCenter(node: SceneNode): Point {
  const b = localBBox(node);
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

/**
 * SVG `transform` attribute value placing the node's local geometry into scene space.
 * Coordinates are coerced via `safeNumber`: this string is embedded directly into the exported
 * SVG file (and used as a live DOM attribute), and scene data can come from an unvalidated
 * loaded project file.
 */
export function svgTransformString(node: SceneNode): string {
  const x = safeNumber(node.transform.x);
  const y = safeNumber(node.transform.y);
  const rotation = safeNumber(node.transform.rotation);
  const scaleX = safeNumber(node.transform.scaleX, 1);
  const scaleY = safeNumber(node.transform.scaleY, 1);
  const parts = [`translate(${x} ${y})`];
  if (rotation !== 0) {
    const c = localCenter(node);
    parts.push(`rotate(${rotation} ${safeNumber(c.x)} ${safeNumber(c.y)})`);
  }
  if (scaleX !== 1 || scaleY !== 1) {
    parts.push(`scale(${scaleX} ${scaleY})`);
  }
  return parts.join(" ");
}

/** Axis-aligned bounding box of the node in scene space, accounting for rotation. */
export function worldBBox(node: SceneNode): BBox {
  const local = localBBox(node);
  const center = localCenter(node);
  const { rotation, x: tx, y: ty, scaleX, scaleY } = node.transform;

  const corners: Point[] = [
    { x: local.x, y: local.y },
    { x: local.x + local.width, y: local.y },
    { x: local.x + local.width, y: local.y + local.height },
    { x: local.x, y: local.y + local.height },
  ].map((p) => ({ x: p.x * scaleX, y: p.y * scaleY }));

  const scaledCenter = { x: center.x * scaleX, y: center.y * scaleY };
  const rotated = corners.map((p) => rotatePoint(p, scaledCenter, rotation));
  const worldPoints = rotated.map((p) => ({ x: p.x + tx, y: p.y + ty }));

  const xs = worldPoints.map((p) => p.x);
  const ys = worldPoints.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function localHandlePoint(local: BBox, handle: string): Point {
  const cx = local.x + local.width / 2;
  const cy = local.y + local.height / 2;
  switch (handle) {
    case "nw":
      return { x: local.x, y: local.y };
    case "n":
      return { x: cx, y: local.y };
    case "ne":
      return { x: local.x + local.width, y: local.y };
    case "e":
      return { x: local.x + local.width, y: cy };
    case "se":
      return { x: local.x + local.width, y: local.y + local.height };
    case "s":
      return { x: cx, y: local.y + local.height };
    case "sw":
      return { x: local.x, y: local.y + local.height };
    case "w":
      return { x: local.x, y: cy };
    default:
      return { x: cx, y: cy };
  }
}

/** Maps a point in the node's local coordinate space into world/user space (applies scale, then rotation, then translation — matching `worldBBox`'s convention). */
export function localToWorldPoint(node: SceneNode, localPoint: Point): Point {
  const { rotation, x: tx, y: ty, scaleX, scaleY } = node.transform;
  const center = localCenter(node);
  const scaledPoint = { x: localPoint.x * scaleX, y: localPoint.y * scaleY };
  const scaledCenter = { x: center.x * scaleX, y: center.y * scaleY };
  const rotated = rotatePoint(scaledPoint, scaledCenter, rotation);
  return { x: rotated.x + tx, y: rotated.y + ty };
}

/** Inverse of the node's transform: maps a world/user-space point back into the node's local coordinate space. */
export function worldToLocal(node: SceneNode, worldPoint: Point): Point {
  const { rotation, x: tx, y: ty, scaleX, scaleY } = node.transform;
  const center = localCenter(node);
  const scaledCenter = { x: center.x * scaleX, y: center.y * scaleY };
  const relative = { x: worldPoint.x - tx, y: worldPoint.y - ty };
  const unrotated = rotatePoint(relative, scaledCenter, -rotation);
  return { x: unrotated.x / (scaleX || 1), y: unrotated.y / (scaleY || 1) };
}

/** World position of a named resize handle, following the shape's own rotation (not the axis-aligned bbox). */
export function worldHandlePosition(node: SceneNode, handle: string): Point {
  return localToWorldPoint(node, localHandlePoint(localBBox(node), handle));
}

/** The 4 corners of the shape's own (possibly rotated) bounding box, for drawing a selection outline that matches the shape. */
export function rotatedOutlineCorners(node: SceneNode): Point[] {
  return (["nw", "ne", "se", "sw"] as const).map((h) => worldHandlePosition(node, h));
}

export function unionBBox(boxes: BBox[]): BBox | null {
  if (boxes.length === 0) return null;
  const minX = Math.min(...boxes.map((b) => b.x));
  const minY = Math.min(...boxes.map((b) => b.y));
  const maxX = Math.max(...boxes.map((b) => b.x + b.width));
  const maxY = Math.max(...boxes.map((b) => b.y + b.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Refreshes cached group bounds after child geometry or transforms change. */
export function refreshGroupBounds(scene: Scene): void {
  const groups = Object.values(scene.elements).filter((node) => node.type === "group");
  // Several passes also settle nested groups, while validation prevents cyclic references on load.
  for (let pass = 0; pass < groups.length; pass += 1) {
    for (const group of groups) {
      const children = group.childIds.map((id) => scene.elements[id]).filter((node): node is SceneNode => Boolean(node));
      group.bounds = unionBBox(children.map(worldBBox)) ?? { x: 0, y: 0, width: 0, height: 0 };
    }
  }
}

export function bboxIntersects(a: BBox, b: BBox): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function pointInBBox(point: Point, box: BBox): boolean {
  return (
    point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height
  );
}
