/**
 * Only a well-formed base64 image data URI is trusted for render/export. A loaded `.svgatelier`
 * project is unvalidated JSON — without this check, a crafted file could set an ImageNode's
 * `href` to a `javascript:` URI or an `onerror`-bearing value and have it land in a live DOM
 * attribute or the exported SVG. Same defense-in-depth spirit as `safeNumber`/`sanitizeImageHref`'s
 * siblings in `gradientDefs.ts`/`filterDefs.ts`.
 */
const SAFE_IMAGE_HREF = /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/;

export function sanitizeImageHref(value: unknown): string {
  return typeof value === "string" && SAFE_IMAGE_HREF.test(value) ? value : "";
}
