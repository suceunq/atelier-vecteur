export type ElementId = string;
export type LayerId = string;

export interface Transform {
  x: number;
  y: number;
  rotation: number; // degrees
  scaleX: number;
  scaleY: number;
}

export interface Style {
  fill: string; // css color, or 'none'
  fillOpacity: number;
  stroke: string; // css color, or 'none'
  strokeWidth: number;
  strokeOpacity: number;
  strokeDasharray: string | null;
  opacity: number;
}

interface BaseNode {
  id: ElementId;
  transform: Transform;
  style: Style;
}

export interface RectNode extends BaseNode {
  type: "rect";
  width: number;
  height: number;
  rx: number;
  ry: number;
}

export interface EllipseNode extends BaseNode {
  type: "ellipse";
  rx: number;
  ry: number;
}

export interface LineNode extends BaseNode {
  type: "line";
  x2: number;
  y2: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface PolygonNode extends BaseNode {
  type: "polygon";
  points: Point[];
}

export type PathNodeType = "corner" | "smooth" | "symmetric";

export interface PathAnchor {
  id: string;
  anchor: Point;
  /** Relative to `anchor`; null = no incoming curve (straight segment on that side). */
  handleIn: Point | null;
  /** Relative to `anchor`; null = no outgoing curve (straight segment on that side). */
  handleOut: Point | null;
  type: PathNodeType;
}

export interface PathNode extends BaseNode {
  type: "path";
  nodes: PathAnchor[];
  closed: boolean;
}

export interface TextNode extends BaseNode {
  type: "text";
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  textAnchor: "start" | "middle" | "end";
}

export type SceneNode = RectNode | EllipseNode | LineNode | PolygonNode | PathNode | TextNode;

export interface GradientStop {
  offset: number;
  color: string;
  opacity: number;
}

export type GradientId = string;

export interface Gradient {
  id: GradientId;
  kind: "linear" | "radial";
  stops: GradientStop[];
  /** Linear: start point. Radial: center. */
  from: Point;
  /** Linear: end point. Radial: a point on the circle (defines the radius). */
  to: Point;
}

export function gradientRef(id: GradientId): string {
  return `gradient:${id}`;
}

export function isGradientRef(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("gradient:");
}

export function gradientIdFromRef(value: string): GradientId {
  return value.slice("gradient:".length);
}

/** DOM id used for the `<linearGradient>`/`<radialGradient>` element — prefixed to avoid colliding with element ids. Restricted to a safe charset: `id` may originate from an unvalidated loaded project file. */
export function gradientElementId(id: GradientId): string {
  const safe = String(id).replace(/[^A-Za-z0-9_-]/g, "");
  return `grad-${safe}`;
}

/**
 * Resolves a fill/stroke value for actual SVG output — a gradient ref becomes `url(#...)`,
 * anything else passes through as a plain color string. Used identically by the live renderer
 * and the export serializer so they can never drift apart. Defensive against non-string input
 * (an unvalidated loaded project file could set this to anything).
 */
export function resolvePaint(value: unknown): string {
  if (isGradientRef(value)) return `url(#${gradientElementId(gradientIdFromRef(value))})`;
  return typeof value === "string" ? value : "none";
}

export interface Layer {
  id: LayerId;
  name: string;
  visible: boolean;
  locked: boolean;
  elementIds: ElementId[];
}

export interface Artboard {
  width: number;
  height: number;
}

export interface Scene {
  artboard: Artboard;
  layers: Layer[];
  elements: Record<ElementId, SceneNode>;
  gradients: Record<GradientId, Gradient>;
}

export const defaultStyle: Style = {
  fill: "#3b82f6",
  fillOpacity: 1,
  stroke: "#1e293b",
  strokeWidth: 1,
  strokeOpacity: 1,
  strokeDasharray: null,
  opacity: 1,
};

export const defaultTransform: Transform = {
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
};
