import { safeNumber } from "../sanitize";
import { filterElementId, type Filter } from "../types";

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/**
 * Renders `<filter>` markup (blur / drop-shadow) for every filter in the scene. Same
 * shared-string, fully-sanitized pattern as `gradientDefs.ts` — every field is coerced/escaped
 * here rather than trusted, since this is used both for SVG export and, via
 * `dangerouslySetInnerHTML`, for the live canvas renderer, and a loaded `.svgatelier` project
 * file is unvalidated JSON.
 */
export function filtersToDefs(filters: Record<string, Filter>): string {
  return Object.values(filters)
    .map((filter) => {
      const id = filterElementId(filter.id);
      const blurRadius = safeNumber(filter.blurRadius, 4);

      if (filter.kind === "blur") {
        return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${blurRadius}"/></filter>`;
      }

      const offsetX = safeNumber(filter.offsetX, 4);
      const offsetY = safeNumber(filter.offsetY, 4);
      const opacity = safeNumber(filter.opacity, 0.5);
      const color = escapeAttr(typeof filter.color === "string" ? filter.color : "#000000");
      return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="${offsetX}" dy="${offsetY}" stdDeviation="${blurRadius}" flood-color="${color}" flood-opacity="${opacity}"/></filter>`;
    })
    .join("");
}
