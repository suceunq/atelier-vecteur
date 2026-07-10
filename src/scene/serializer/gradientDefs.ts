import { safeNumber } from "../sanitize";
import { gradientElementId, type Gradient } from "../types";

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function stopsMarkup(gradient: Gradient): string {
  return gradient.stops
    .map((stop) => {
      const offset = safeNumber(stop.offset);
      const opacity = safeNumber(stop.opacity, 1);
      const color = escapeAttr(typeof stop.color === "string" ? stop.color : "#000000");
      return `<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>`;
    })
    .join("");
}

/**
 * Renders `<linearGradient>`/`<radialGradient>` markup for every gradient in the scene.
 * Shared, literal string output — used both for SVG export (`toSvg.ts`) and, via
 * `dangerouslySetInnerHTML` on a `<defs>` element, for the live canvas renderer — so the
 * two never drift apart.
 *
 * Every field is sanitized here rather than trusted from the caller: a loaded `.svgatelier`
 * project file is untyped/unvalidated JSON, so a crafted file could otherwise inject arbitrary
 * markup (and, via `dangerouslySetInnerHTML` in the live renderer, arbitrary script) through any
 * unescaped string or non-numeric "number" field.
 */
export function gradientsToDefs(gradients: Record<string, Gradient>): string {
  return Object.values(gradients)
    .map((gradient) => {
      const id = gradientElementId(gradient.id);
      const stops = stopsMarkup(gradient);
      const fromX = safeNumber(gradient.from?.x);
      const fromY = safeNumber(gradient.from?.y);
      const toX = safeNumber(gradient.to?.x);
      const toY = safeNumber(gradient.to?.y);
      if (gradient.kind === "linear") {
        return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${fromX}" y1="${fromY}" x2="${toX}" y2="${toY}">${stops}</linearGradient>`;
      }
      const radius = Math.hypot(toX - fromX, toY - fromY) || 1;
      return `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${fromX}" cy="${fromY}" r="${radius}">${stops}</radialGradient>`;
    })
    .join("");
}
