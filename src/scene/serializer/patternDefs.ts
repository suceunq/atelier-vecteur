import { safeNumber } from "../sanitize";
import { patternElementId, type Pattern } from "../types";

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function patternBody(pattern: Pattern, size: number, color: string, background: string): string {
  const bg = `<rect width="${size}" height="${size}" fill="${background}"/>`;
  switch (pattern.kind) {
    case "dots":
      return `${bg}<circle cx="${size / 2}" cy="${size / 2}" r="${size / 4}" fill="${color}"/>`;
    case "stripes":
      return `${bg}<rect width="${size}" height="${size / 2}" fill="${color}"/>`;
    case "grid": {
      const strokeW = Math.max(1, size / 10);
      return `${bg}<rect x="0" y="0" width="${size}" height="${strokeW}" fill="${color}"/><rect x="0" y="0" width="${strokeW}" height="${size}" fill="${color}"/>`;
    }
    case "checkerboard": {
      const half = size / 2;
      return `${bg}<rect x="0" y="0" width="${half}" height="${half}" fill="${color}"/><rect x="${half}" y="${half}" width="${half}" height="${half}" fill="${color}"/>`;
    }
  }
}

/**
 * Renders `<pattern>` markup for every generated (non-image) pattern in the scene. Same
 * shared-string, fully-sanitized pattern as `gradientDefs.ts`/`filterDefs.ts`.
 */
export function patternsToDefs(patterns: Record<string, Pattern>): string {
  return Object.values(patterns)
    .map((pattern) => {
      const id = patternElementId(pattern.id);
      const size = Math.max(1, safeNumber(pattern.size, 12));
      const color = escapeAttr(typeof pattern.color === "string" ? pattern.color : "#3b82f6");
      const background = escapeAttr(typeof pattern.background === "string" ? pattern.background : "#ffffff");
      const body = patternBody(pattern, size, color, background);
      return `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">${body}</pattern>`;
    })
    .join("");
}
