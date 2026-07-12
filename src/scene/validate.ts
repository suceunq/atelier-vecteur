import type { Scene } from "./types";

/**
 * Minimal structural check on a loaded `.svgatelier` project file before it's accepted into the
 * app: a project file is unvalidated JSON (no schema enforcement on the Rust side), so this
 * rejects wildly malformed payloads before they reach the store. It intentionally does not deep-
 * validate every node field — the render/export code paths (`geometry.ts`, `bezier.ts`,
 * `gradientDefs.ts`/`filterDefs.ts`/`patternDefs.ts`, `toSvg.ts`) sanitize numeric/string fields
 * at the point of use, since that's the boundary that actually matters for safety and can't be
 * bypassed by a check made here.
 */
export function isPlausibleScene(value: unknown): value is Scene {
  if (typeof value !== "object" || value === null) return false;
  const scene = value as Record<string, unknown>;

  if (!Array.isArray(scene.artboards) || scene.artboards.length === 0) return false;
  for (const artboard of scene.artboards) {
    if (typeof artboard !== "object" || artboard === null) return false;
    const a = artboard as Record<string, unknown>;
    if (typeof a.width !== "number" || typeof a.height !== "number") return false;
  }

  if (!Array.isArray(scene.layers)) return false;
  if (typeof scene.elements !== "object" || scene.elements === null) return false;
  if (typeof scene.gradients !== "object" || scene.gradients === null) return false;
  if (typeof scene.patterns !== "object" || scene.patterns === null) return false;
  if (typeof scene.filters !== "object" || scene.filters === null) return false;

  return true;
}
