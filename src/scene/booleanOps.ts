import PolyBool, { type Polygon } from "polybooljs";
import { createMultiPath, createPathAnchor } from "./factory";
import { localToWorldPoint } from "./geometry";
import { pathSegments, flattenCubic } from "./bezier";
import type { PathNode, Point, SceneNode, Style } from "./types";

export type BooleanOpKind = "union" | "subtract" | "intersect" | "exclude";

const ELLIPSE_SEGMENTS = 64;
const CURVE_SEGMENTS = 24;

function ringFromLocalPoints(node: SceneNode, points: Point[]): number[][] {
  return points.map((p) => {
    const world = localToWorldPoint(node, p);
    return [world.x, world.y];
  });
}

export function isBooleanCapable(node: SceneNode): boolean {
  return node.type === "rect" || node.type === "ellipse" || node.type === "polygon" || node.type === "path";
}

/**
 * Flattens a shape into world-space polygon rings for polybooljs. Returns null for shapes with no
 * sensible fill polygon (a line has no interior; text/group/image aren't handled) or a path with
 * no closed subpath.
 */
export function shapeToPolygon(node: SceneNode): Polygon | null {
  switch (node.type) {
    case "rect": {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: node.width, y: 0 },
        { x: node.width, y: node.height },
        { x: 0, y: node.height },
      ];
      return { regions: [ringFromLocalPoints(node, points)], inverted: false };
    }
    case "ellipse": {
      const points: Point[] = [];
      for (let i = 0; i < ELLIPSE_SEGMENTS; i++) {
        const angle = (i / ELLIPSE_SEGMENTS) * Math.PI * 2;
        points.push({ x: node.rx * Math.cos(angle), y: node.ry * Math.sin(angle) });
      }
      return { regions: [ringFromLocalPoints(node, points)], inverted: false };
    }
    case "polygon":
      return node.points.length >= 3 ? { regions: [ringFromLocalPoints(node, node.points)], inverted: false } : null;
    case "path": {
      const allSegments = pathSegments(node);
      const regions: number[][][] = [];
      for (let subpathIndex = 0; subpathIndex < node.subpaths.length; subpathIndex++) {
        const subpath = node.subpaths[subpathIndex];
        if (!subpath.closed || subpath.nodes.length < 2) continue;
        const segs = allSegments.filter((s) => s.subpathIndex === subpathIndex);
        const points: Point[] = [];
        segs.forEach((seg, i) => {
          const flattened = seg.isLine ? [seg.p0, seg.p3] : flattenCubic(seg.p0, seg.p1, seg.p2, seg.p3, CURVE_SEGMENTS);
          points.push(...(i === 0 ? flattened : flattened.slice(1)));
        });
        if (points.length >= 3) regions.push(ringFromLocalPoints(node, points));
      }
      return regions.length > 0 ? { regions, inverted: false } : null;
    }
    case "line":
    case "text":
    case "group":
    case "image":
      return null;
  }
}

function combine(kind: BooleanOpKind, a: Polygon, b: Polygon): Polygon {
  switch (kind) {
    case "union":
      return PolyBool.union(a, b);
    case "subtract":
      return PolyBool.difference(a, b);
    case "intersect":
      return PolyBool.intersect(a, b);
    case "exclude":
      return PolyBool.xor(a, b);
  }
}

/**
 * Combines the world-space polygons of `orderedNodes` (bottom-to-top z-order — matters for
 * "subtract", which removes every other shape from the topmost one, matching the usual "front
 * minus back" convention) into a single new PathNode carrying `style`. The result's anchors
 * already hold final world coordinates, so its own transform is left at identity. Returns null if
 * fewer than two shapes have a usable polygon, or the operation leaves nothing (e.g. intersecting
 * shapes that don't actually overlap).
 */
export function booleanOpToPathNode(kind: BooleanOpKind, orderedNodes: SceneNode[], style: Style): PathNode | null {
  const polygons = orderedNodes.map(shapeToPolygon).filter((p): p is Polygon => p !== null);
  if (polygons.length < 2) return null;

  const result =
    kind === "subtract"
      ? (() => {
          const topDown = [...polygons].reverse();
          const [base, ...rest] = topDown;
          return rest.reduce((acc, poly) => combine("subtract", acc, poly), base);
        })()
      : polygons.reduce((acc, poly) => combine(kind, acc, poly));

  const subpaths = result.regions
    .filter((ring) => ring.length >= 3)
    .map((ring) => ({ nodes: ring.map(([x, y]) => createPathAnchor({ x, y })), closed: true }));
  if (subpaths.length === 0) return null;

  const path = createMultiPath(0, 0, subpaths);
  path.style = { ...style };
  return path;
}
