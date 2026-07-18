import { nanoid } from "nanoid";
import {
  defaultStyle,
  defaultTransform,
  type Artboard,
  type EllipseNode,
  type Filter,
  type FilterKind,
  type Gradient,
  type GroupNode,
  type ImageNode,
  type Layer,
  type LineNode,
  type Pattern,
  type PatternKind,
  type PathAnchor,
  type PathNode,
  type PathNodeType,
  type PathSubpath,
  type Point,
  type PolygonNode,
  type RectNode,
  type Scene,
  type SceneNode,
  type TextNode,
} from "./types";
import { worldBBox, unionBBox } from "./geometry";
import { t } from "../i18n";

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

/** A path with a single subpath — the common case for hand-drawn paths (pen tool). */
export function createPath(originX: number, originY: number, nodes: PathAnchor[], closed = false): PathNode {
  return createMultiPath(originX, originY, [{ nodes, closed }]);
}

/** A path with one or more subpaths (e.g. text-to-path output, where a glyph like "o" needs an outer ring + inner hole). */
export function createMultiPath(originX: number, originY: number, subpaths: PathSubpath[]): PathNode {
  const hasClosedSubpath = subpaths.some((s) => s.closed);
  return {
    id: createId(),
    type: "path",
    transform: { ...defaultTransform, x: originX, y: originY },
    style: { ...defaultStyle, fill: hasClosedSubpath ? defaultStyle.fill : "none" },
    subpaths,
  };
}

export function createText(x: number, y: number, content = t("document.defaultText")): TextNode {
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

export function createPattern(kind: PatternKind): Pattern {
  return {
    id: createId(),
    kind,
    size: 12,
    color: "#3b82f6",
    background: "#ffffff",
  };
}

export function createFilter(kind: FilterKind): Filter {
  return {
    id: createId(),
    kind,
    blurRadius: kind === "blur" ? 4 : 3,
    offsetX: 4,
    offsetY: 4,
    color: "#000000",
    opacity: 0.5,
  };
}

/** Groups the given nodes under a new GroupNode. Children keep their existing world coordinates as their local-to-group coordinates (the group starts at an identity transform). */
export function createGroup(nodes: SceneNode[]): GroupNode {
  const bounds = unionBBox(nodes.map(worldBBox)) ?? { x: 0, y: 0, width: 0, height: 0 };
  return {
    id: createId(),
    type: "group",
    transform: { ...defaultTransform },
    style: { ...defaultStyle, fill: "none", stroke: "none" },
    childIds: nodes.map((n) => n.id),
    bounds,
  };
}

/** Deep-clones a node with a fresh id (and fresh path-anchor ids), offset by (dx,dy) — used for copy/paste and duplicate. */
export function cloneNodeWithOffset(node: SceneNode, dx: number, dy: number): SceneNode {
  const clone: SceneNode = JSON.parse(JSON.stringify(node));
  clone.id = createId();
  clone.transform = { ...clone.transform, x: clone.transform.x + dx, y: clone.transform.y + dy };
  if (clone.type === "path") {
    clone.subpaths = clone.subpaths.map((subpath) => ({
      ...subpath,
      nodes: subpath.nodes.map((anchor) => ({ ...anchor, id: createId() })),
    }));
  }
  return clone;
}

export function createImage(
  originX: number,
  originY: number,
  href: string,
  width: number,
  height: number
): ImageNode {
  return {
    id: createId(),
    type: "image",
    transform: { ...defaultTransform, x: originX, y: originY },
    style: { ...defaultStyle, fill: "none", stroke: "none" },
    href,
    width,
    height,
  };
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

export function createArtboard(name: string, x: number, y: number, width = 800, height = 600): Artboard {
  return { id: createId(), name, x, y, width, height };
}

export function createEmptyScene(): Scene {
  const layer = createLayer(t("layer.defaultName", { number: 1 }));
  return {
    artboards: [createArtboard(t("artboard.defaultName", { number: 1 }), 0, 0)],
    layers: [layer],
    elements: {},
    gradients: {},
    patterns: {},
    filters: {},
  };
}
