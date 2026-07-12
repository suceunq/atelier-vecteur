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
  fill: string; // css color, 'none', 'gradient:<id>', or 'pattern:<id>'
  fillOpacity: number;
  stroke: string; // css color, or 'none'
  strokeWidth: number;
  strokeOpacity: number;
  strokeDasharray: string | null;
  opacity: number;
  /** References a Filter in Scene.filters (`"filter:<id>"`), or null for no filter. */
  filter: string | null;
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

/** One contour of a path. A path can have several (e.g. a letter "o" = outer ring + inner hole). */
export interface PathSubpath {
  nodes: PathAnchor[];
  closed: boolean;
}

export interface PathNode extends BaseNode {
  type: "path";
  subpaths: PathSubpath[];
}

export interface TextNode extends BaseNode {
  type: "text";
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  textAnchor: "start" | "middle" | "end";
}

export interface GroupNode extends BaseNode {
  type: "group";
  childIds: ElementId[];
  /**
   * Union bbox of the children at the moment the group was created, in the group's local space
   * (children keep their pre-existing world coordinates as their local-to-group coordinates,
   * since a freshly created group starts at an identity transform). Used for selection-handle
   * sizing; not recomputed automatically if a child is edited afterward while inside the group
   * (a known, disclosed simplification).
   */
  bounds: { x: number; y: number; width: number; height: number };
}

export type SceneNode =
  | RectNode
  | EllipseNode
  | LineNode
  | PolygonNode
  | PathNode
  | TextNode
  | GroupNode;

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

/** Restricts a raw id to a safe DOM-id charset — values may originate from an unvalidated loaded project file. */
function safeIdSuffix(id: string): string {
  return String(id).replace(/[^A-Za-z0-9_-]/g, "");
}

/** DOM id used for the `<linearGradient>`/`<radialGradient>` element — prefixed to avoid colliding with element ids. */
export function gradientElementId(id: GradientId): string {
  return `grad-${safeIdSuffix(id)}`;
}

export type PatternId = string;

export type PatternKind = "dots" | "stripes" | "grid" | "checkerboard";

export interface Pattern {
  id: PatternId;
  kind: PatternKind;
  size: number;
  color: string;
  background: string;
}

export function patternRef(id: PatternId): string {
  return `pattern:${id}`;
}

export function isPatternRef(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("pattern:");
}

export function patternIdFromRef(value: string): PatternId {
  return value.slice("pattern:".length);
}

export function patternElementId(id: PatternId): string {
  return `pat-${safeIdSuffix(id)}`;
}

/**
 * Resolves a fill/stroke value for actual SVG output — a gradient/pattern ref becomes `url(#...)`,
 * anything else passes through as a plain color string. Used identically by the live renderer
 * and the export serializer so they can never drift apart. Defensive against non-string input
 * (an unvalidated loaded project file could set this to anything).
 */
export function resolvePaint(value: unknown): string {
  if (isGradientRef(value)) return `url(#${gradientElementId(gradientIdFromRef(value))})`;
  if (isPatternRef(value)) return `url(#${patternElementId(patternIdFromRef(value))})`;
  return typeof value === "string" ? value : "none";
}

export type FilterId = string;
export type FilterKind = "blur" | "shadow";

export interface Filter {
  id: FilterId;
  kind: FilterKind;
  /** blur: the feGaussianBlur stdDeviation. shadow: the shadow's own blur softness. */
  blurRadius: number;
  /** shadow only. */
  offsetX: number;
  offsetY: number;
  color: string;
  opacity: number;
}

export function filterRef(id: FilterId): string {
  return `filter:${id}`;
}

export function isFilterRef(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("filter:");
}

export function filterIdFromRef(value: string): FilterId {
  return value.slice("filter:".length);
}

export function filterElementId(id: FilterId): string {
  return `filt-${safeIdSuffix(id)}`;
}

/** Resolves a node's style.filter into the `filter="url(#...)"` attribute value, or undefined for none. */
export function resolveFilterRef(value: string | null | undefined): string | undefined {
  return isFilterRef(value) ? `url(#${filterElementId(filterIdFromRef(value))})` : undefined;
}

export interface Layer {
  id: LayerId;
  name: string;
  visible: boolean;
  locked: boolean;
  elementIds: ElementId[];
}

export type ArtboardId = string;

export interface Artboard {
  id: ArtboardId;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Scene {
  artboards: Artboard[];
  layers: Layer[];
  elements: Record<ElementId, SceneNode>;
  gradients: Record<GradientId, Gradient>;
  patterns: Record<PatternId, Pattern>;
  filters: Record<FilterId, Filter>;
}

export const defaultStyle: Style = {
  fill: "#3b82f6",
  fillOpacity: 1,
  stroke: "#1e293b",
  strokeWidth: 1,
  strokeOpacity: 1,
  strokeDasharray: null,
  opacity: 1,
  filter: null,
};

export const defaultTransform: Transform = {
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
};
