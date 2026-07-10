import { gradientElementId, type Gradient } from "../types";

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function stopsMarkup(gradient: Gradient): string {
  return gradient.stops
    .map(
      (stop) =>
        `<stop offset="${stop.offset}" stop-color="${escapeAttr(stop.color)}" stop-opacity="${stop.opacity}"/>`
    )
    .join("");
}

/**
 * Renders `<linearGradient>`/`<radialGradient>` markup for every gradient in the scene.
 * Shared, literal string output — used both for SVG export (`toSvg.ts`) and, via
 * `dangerouslySetInnerHTML` on a `<defs>` element, for the live canvas renderer — so the
 * two never drift apart.
 */
export function gradientsToDefs(gradients: Record<string, Gradient>): string {
  return Object.values(gradients)
    .map((gradient) => {
      const id = gradientElementId(gradient.id);
      const stops = stopsMarkup(gradient);
      if (gradient.kind === "linear") {
        return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${gradient.from.x}" y1="${gradient.from.y}" x2="${gradient.to.x}" y2="${gradient.to.y}">${stops}</linearGradient>`;
      }
      const radius = Math.hypot(gradient.to.x - gradient.from.x, gradient.to.y - gradient.from.y) || 1;
      return `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${gradient.from.x}" cy="${gradient.from.y}" r="${radius}">${stops}</radialGradient>`;
    })
    .join("");
}
