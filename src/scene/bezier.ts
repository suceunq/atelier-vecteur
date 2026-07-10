import type { PathAnchor, PathNode, Point } from "./types";

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
  /** Index of the segment's starting anchor in `node.nodes`. */
  startIndex: number;
}

/** Resolves each anchor pair into absolute (local-space) cubic control points. Straight segments use collapsed control points. */
export function pathSegments(node: PathNode): PathSegment[] {
  const { nodes, closed } = node;
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
    segments.push({ p0, p1, p2, p3, isLine: !a.handleOut && !b.handleIn, startIndex: i });
  }
  return segments;
}

/** Derives the SVG `d` attribute from the structured anchor/handle model — never stored directly. */
export function pathToD(node: PathNode): string {
  if (node.nodes.length === 0) return "";
  const start = node.nodes[0].anchor;
  const parts = [`M ${start.x} ${start.y}`];

  for (const seg of pathSegments(node)) {
    if (seg.isLine) {
      parts.push(`L ${seg.p3.x} ${seg.p3.y}`);
    } else {
      parts.push(`C ${seg.p1.x} ${seg.p1.y} ${seg.p2.x} ${seg.p2.y} ${seg.p3.x} ${seg.p3.y}`);
    }
  }
  if (node.closed) parts.push("Z");
  return parts.join(" ");
}

/** Bounding box of the anchor+handle control polygon — a safe superset of the curve's true bounds. */
export function controlPolygonBBox(nodes: PathAnchor[]): { x: number; y: number; width: number; height: number } {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const n of nodes) {
    xs.push(n.anchor.x);
    ys.push(n.anchor.y);
    if (n.handleIn) {
      xs.push(n.anchor.x + n.handleIn.x);
      ys.push(n.anchor.y + n.handleIn.y);
    }
    if (n.handleOut) {
      xs.push(n.anchor.x + n.handleOut.x);
      ys.push(n.anchor.y + n.handleOut.y);
    }
  }
  if (xs.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Nearest point on the path to `target`, for double-click segment-insertion in the node-edit tool. */
export function closestPointOnPath(
  node: PathNode,
  target: Point
): { point: Point; segmentIndex: number; t: number; distance: number } | null {
  let best: { point: Point; segmentIndex: number; t: number; distance: number } | null = null;

  for (const seg of pathSegments(node)) {
    const samples = 24;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const p = cubicPoint(seg.p0, seg.p1, seg.p2, seg.p3, t);
      const distance = Math.hypot(p.x - target.x, p.y - target.y);
      if (!best || distance < best.distance) {
        best = { point: p, segmentIndex: seg.startIndex, t, distance };
      }
    }
  }
  return best;
}
