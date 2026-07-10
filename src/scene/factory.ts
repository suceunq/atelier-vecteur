import { nanoid } from "nanoid";
import {
  defaultStyle,
  defaultTransform,
  type EllipseNode,
  type Gradient,
  type Layer,
  type LineNode,
  type PathAnchor,
  type PathNode,
  type PathNodeType,
  type Point,
  type PolygonNode,
  type RectNode,
  type Scene,
  type SceneNode,
  type TextNode,
} from "./types";

export function createId(): string {
  return nanoid(10);
}

export function createRect(x: number, y: number, width: number, height: number): RectNode {
  return {
    id: createId(),
    type: "rect",
    transform: { ...defaultTransform, x, y },
    style: { ...defaultStyle },
    width,
    height,
    rx: 0,
    ry: 0,
  };
}

export function createEllipse(cx: number, cy: number, rx: number, ry: number): EllipseNode {
  return {
    id: createId(),
    type: "ellipse",
    transform: { ...defaultTransform, x: cx, y: cy },
    style: { ...defaultStyle },
    rx,
    ry,
  };
}

export function createLine(x1: number, y1: number, x2: number, y2: number): LineNode {
  return {
    id: createId(),
    type: "line",
    transform: { ...defaultTransform, x: x1, y: y1 },
    style: { ...defaultStyle, fill: "none" },
    x2: x2 - x1,
    y2: y2 - y1,
  };
}

export function createPolygon(originX: number, originY: number, points: Point[]): PolygonNode {
  return {
    id: createId(),
    type: "polygon",
    transform: { ...defaultTransform, x: originX, y: originY },
    style: { ...defaultStyle },
    points,
  };
}

/** Regular polygon centered on its own local origin (0,0), first vertex pointing up. */
export function regularPolygonPoints(radius: number, sides = 6): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
    points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
  }
  return points;
}

export function createRegularPolygon(cx: number, cy: number, radius: number, sides = 6): PolygonNode {
  return createPolygon(cx, cy, regularPolygonPoints(radius, sides));
}

export function createPathAnchor(anchor: Point, type: PathNodeType = "corner"): PathAnchor {
  return { id: createId(), anchor, handleIn: null, handleOut: null, type };
}

export function createPath(originX: number, originY: number, nodes: PathAnchor[], closed = false): PathNode {
  return {
    id: createId(),
    type: "path",
    transform: { ...defaultTransform, x: originX, y: originY },
    style: { ...defaultStyle, fill: closed ? defaultStyle.fill : "none" },
    nodes,
    closed,
  };
}

export function createText(x: number, y: number, content = "Texte"): TextNode {
  return {
    id: createId(),
    type: "text",
    transform: { ...defaultTransform, x, y },
    style: { ...defaultStyle, stroke: "none" },
    content,
    fontFamily: "Arial, sans-serif",
    fontSize: 24,
    fontWeight: 400,
    textAnchor: "start",
  };
}

export function createGradient(kind: "linear" | "radial", from: Point, to: Point): Gradient {
  return {
    id: createId(),
    kind,
    from,
    to,
    stops: [
      { offset: 0, color: "#3b82f6", opacity: 1 },
      { offset: 1, color: "#8b5cf6", opacity: 1 },
    ],
  };
}

/** Deep-clones a node with a fresh id (and fresh path-anchor ids), offset by (dx,dy) — used for copy/paste and duplicate. */
export function cloneNodeWithOffset(node: SceneNode, dx: number, dy: number): SceneNode {
  const clone: SceneNode = JSON.parse(JSON.stringify(node));
  clone.id = createId();
  clone.transform = { ...clone.transform, x: clone.transform.x + dx, y: clone.transform.y + dy };
  if (clone.type === "path") {
    clone.nodes = clone.nodes.map((anchor) => ({ ...anchor, id: createId() }));
  }
  return clone;
}

export function createLayer(name: string): Layer {
  return {
    id: createId(),
    name,
    visible: true,
    locked: false,
    elementIds: [],
  };
}

export function createEmptyScene(): Scene {
  const layer = createLayer("Calque 1");
  return {
    artboard: { width: 800, height: 600 },
    layers: [layer],
    elements: {},
    gradients: {},
  };
}
