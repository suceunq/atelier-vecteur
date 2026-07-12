import { safeNumber } from "./sanitize";
import type { PathNode, PathSubpath, Point } from "./types";

function n(value: number): number {
  return safeNumber(value);
}

export function cubicPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const mt = 1 - t;
  const a = mt * mt * mt;
  const b = 3 * mt * mt * t;
  const c = 3 * mt * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

/** Adaptive-ish flattening: fixed subdivision count, plenty for hit-testing/closest-point at editor scale. */
export function flattenCubic(p0: Point, p1: Point, p2: Point, p3: Point, segments = 24): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= segments; i++) {
    points.push(cubicPoint(p0, p1, p2, p3, i / segments));
  }
  return points;
}

function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Exact De Casteljau subdivision at `t` — splits one cubic into two that together retrace the original curve. */
export function subdivideCubic(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): { left: [Point, Point, Point, Point]; right: [Point, Point, Point, Point] } {
  const p01 = lerp(p0, p1, t);
  const p12 = lerp(p1, p2, t);
  const p23 = lerp(p2, p3, t);
  const p012 = lerp(p01, p12, t);
  const p123 = lerp(p12, p23, t);
  const split = lerp(p012, p123, t);
  return {
    left: [p0, p01, p012, split],
    right: [split, p123, p23, p3],
  };
}

export interface PathSegment {
  p0: Point;
  p1: Point;
  p2: Point;
  p3: Point;
  isLine: boolean;
  /** Which subpath (in `node.subpaths`) this segment belongs to. */
  subpathIndex: number;
  /** Index of the segment's starting anchor within that subpath's `nodes`. */
  startIndex: number;
}

/** Resolves one subpath's anchor pairs into absolute (local-space) cubic control points. */
function subpathSegments(subpath: PathSubpath, subpathIndex: number): PathSegment[] {
  const { nodes, closed } = subpath;
  const segments: PathSegment[] = [];
  const count = nodes.length;
  const last = closed ? count : count - 1;

  for (let i = 0; i < last; i++) {
    const a = nodes[i];
    const b = nodes[(i + 1) % count];
    const p0 = a.anchor;
    const p3 = b.anchor;
    const p1 = a.handleOut ? { x: p0.x + a.handleOut.x, y: p0.y + a.handleOut.y } : p0;
    const p2 = b.handleIn ? { x: p3.x + b.handleIn.x, y: p3.y + b.handleIn.y } : p3;
    segments.push({ p0, p1, p2, p3, isLine: !a.handleOut && !b.handleIn, subpathIndex, startIndex: i });
  }
  return segments;
}

/** All segments across every subpath of the path, each tagged with its subpath index. */
export function pathSegments(node: PathNode): PathSegment[] {
  return node.subpaths.flatMap((subpath, i) => subpathSegments(subpath, i));
}

/**
 * Derives the SVG `d` attribute from the structured subpath/anchor/handle model — never stored
 * directly. Coordinates go through `safeNumber`: this string is embedded directly into the
 * exported SVG file (and used as a live DOM attribute), and a loaded project file is unvalidated
 * JSON. Each subpath becomes its own `M ... Z` (or open `M ...`) block.
 */
export function pathToD(node: PathNode): string {
  const blocks: string[] = [];

  for (let subpathIndex = 0; subpathIndex < node.subpaths.length; subpathIndex++) {
    const subpath = node.subpaths[subpathIndex];
    if (subpath.nodes.length === 0) continue;
    const start = subpath.nodes[0].anchor;
    const parts = [`M ${n(start.x)} ${n(start.y)}`];

    for (const seg of subpathSegments(subpath, subpathIndex)) {
      if (seg.isLine) {
        parts.push(`L ${n(seg.p3.x)} ${n(seg.p3.y)}`);
      } else {
        parts.push(
          `C ${n(seg.p1.x)} ${n(seg.p1.y)} ${n(seg.p2.x)} ${n(seg.p2.y)} ${n(seg.p3.x)} ${n(seg.p3.y)}`
        );
      }
    }
    if (subpath.closed) parts.push("Z");
    blocks.push(parts.join(" "));
  }

  return blocks.join(" ");
}

/** Bounding box of the anchor+handle control polygon across all subpaths — a safe superset of the curve's true bounds. */
export function controlPolygonBBox(subpaths: PathSubpath[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const subpath of subpaths) {
    for (const anchor of subpath.nodes) {
      xs.push(anchor.anchor.x);
      ys.push(anchor.anchor.y);
      if (anchor.handleIn) {
        xs.push(anchor.anchor.x + anchor.handleIn.x);
        ys.push(anchor.anchor.y + anchor.handleIn.y);
      }
      if (anchor.handleOut) {
        xs.push(anchor.anchor.x + anchor.handleOut.x);
        ys.push(anchor.anchor.y + anchor.handleOut.y);
      }
    }
  }
  if (xs.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Nearest point on the path (across all subpaths) to `target`, for double-click segment-insertion in the node-edit tool. */
export function closestPointOnPath(
  node: PathNode,
  target: Point
): { point: Point; subpathIndex: number; segmentIndex: number; t: number; distance: number } | null {
  let best: { point: Point; subpathIndex: number; segmentIndex: number; t: number; distance: number } | null =
    null;

  for (const seg of pathSegments(node)) {
    const samples = 24;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const p = cubicPoint(seg.p0, seg.p1, seg.p2, seg.p3, t);
      const distance = Math.hypot(p.x - target.x, p.y - target.y);
      if (!best || distance < best.distance) {
        best = { point: p, subpathIndex: seg.subpathIndex, segmentIndex: seg.startIndex, t, distance };
      }
    }
  }
  return best;
}
