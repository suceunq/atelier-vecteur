/**
 * Coerces a value to a finite number for safe interpolation into hand-built SVG/HTML strings.
 * Scene data can come from a loaded `.svgatelier` file, which is untrusted input (not
 * schema-validated) — a malicious file could set a numeric field to an arbitrary string
 * (e.g. `"1\" onmouseover=\"..."`) to break out of an attribute in the generated markup.
 * Every value interpolated into `toSvg.ts` / `gradientDefs.ts` / `bezier.ts`'s string builders
 * must go through this first.
 */
export function safeNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}
