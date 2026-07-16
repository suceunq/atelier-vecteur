import type { Scene } from "./types";

const NODE_TYPES = new Set(["rect", "ellipse", "line", "polygon", "path", "text", "group", "image"]);
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const id = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.length <= 200;
const record = (value: unknown): value is Record<string, unknown> => object(value) && !Array.isArray(value);

function validTransform(value: unknown): boolean {
  if (!object(value)) return false;
  return ["x", "y", "rotation", "scaleX", "scaleY"].every((key) => finite(value[key]));
}

function validStyle(value: unknown): boolean {
  if (!object(value)) return false;
  return (
    typeof value.fill === "string" && typeof value.stroke === "string" &&
    ["fillOpacity", "strokeWidth", "strokeOpacity", "opacity"].every((key) => finite(value[key])) &&
    (value.strokeDasharray === null || typeof value.strokeDasharray === "string") &&
    (value.filter === null || typeof value.filter === "string") &&
    (value.fillRule === "nonzero" || value.fillRule === "evenodd")
  );
}

function validNode(value: unknown, key: string): boolean {
  if (!record(value) || value.id !== key || !id(value.id) || !NODE_TYPES.has(String(value.type))) return false;
  if (!validTransform(value.transform) || !validStyle(value.style)) return false;
  switch (value.type) {
    case "rect": return finite(value.width) && finite(value.height) && finite(value.rx) && finite(value.ry);
    case "ellipse": return finite(value.rx) && finite(value.ry);
    case "line": return finite(value.x2) && finite(value.y2);
    case "polygon": return Array.isArray(value.points) && value.points.every((p) => object(p) && finite(p.x) && finite(p.y));
    case "path": return Array.isArray(value.subpaths) && value.subpaths.every((s) => object(s) && typeof s.closed === "boolean" && Array.isArray(s.nodes));
    case "text": return typeof value.content === "string" && typeof value.fontFamily === "string" && finite(value.fontSize) && finite(value.fontWeight) && ["start", "middle", "end"].includes(String(value.textAnchor));
    case "group": {
      if (!Array.isArray(value.childIds) || !value.childIds.every(id) || !object(value.bounds)) return false;
      const bounds = value.bounds;
      return ["x", "y", "width", "height"].every((key) => finite(bounds[key]));
    }
    case "image": return typeof value.href === "string" && finite(value.width) && finite(value.height);
    default: return false;
  }
}

function hasGroupCycle(elements: Record<string, unknown>): boolean {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (elementId: string): boolean => {
    if (visiting.has(elementId)) return true;
    if (visited.has(elementId)) return false;
    visiting.add(elementId);
    const node = elements[elementId] as Record<string, unknown>;
    if (node?.type === "group") {
      for (const childId of node.childIds as string[]) if (visit(childId)) return true;
    }
    visiting.delete(elementId);
    visited.add(elementId);
    return false;
  };
  return Object.keys(elements).some(visit);
}

/** Deep structural and referential validation for untrusted `.svgatelier` scene data. */
export function isPlausibleScene(value: unknown): value is Scene {
  if (!record(value) || !Array.isArray(value.artboards) || value.artboards.length === 0) return false;
  if (!Array.isArray(value.layers) || value.layers.length === 0 || !record(value.elements)) return false;
  if (!record(value.gradients) || !record(value.patterns) || !record(value.filters)) return false;

  const elementIds = new Set(Object.keys(value.elements));
  if (!Object.entries(value.elements).every(([key, node]) => validNode(node, key))) return false;
  if (!value.artboards.every((a) => record(a) && id(a.id) && typeof a.name === "string" && ["x", "y", "width", "height"].every((key) => finite(a[key])) && Number(a.width) > 0 && Number(a.height) > 0)) return false;

  const topLevelIds = new Set<string>();
  for (const layer of value.layers) {
    if (!record(layer) || !id(layer.id) || typeof layer.name !== "string" || typeof layer.visible !== "boolean" || typeof layer.locked !== "boolean" || !Array.isArray(layer.elementIds)) return false;
    for (const elementId of layer.elementIds) {
      if (!id(elementId) || !elementIds.has(elementId) || topLevelIds.has(elementId)) return false;
      topLevelIds.add(elementId);
    }
  }

  const childIds = new Set<string>();
  for (const node of Object.values(value.elements) as Record<string, unknown>[]) {
    if (node.type !== "group") continue;
    for (const childId of node.childIds as string[]) {
      if (!elementIds.has(childId) || childId === node.id || childIds.has(childId)) return false;
      childIds.add(childId);
    }
  }
  if ([...childIds].some((childId) => topLevelIds.has(childId)) || hasGroupCycle(value.elements)) return false;
  return [...elementIds].every((elementId) => topLevelIds.has(elementId) || childIds.has(elementId));
}
