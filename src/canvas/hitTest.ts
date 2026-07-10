export interface HitResult {
  elementId: string | null;
  handle: string | null;
}

/**
 * Hit-tests using the browser's own rendering (`elementsFromPoint`) rather than
 * reimplementing fill/stroke geometry math — the DOM already knows exactly what's
 * visibly on top at a given pixel, including opacity and paint-order. Selection
 * handles are drawn in a layer above the scene, so they naturally win ties.
 */
export function hitTestAtScreenPoint(clientX: number, clientY: number): HitResult {
  const stack = document.elementsFromPoint(clientX, clientY);
  for (const el of stack) {
    const handle = el.getAttribute("data-handle");
    if (handle) return { elementId: null, handle };
    const id = el.getAttribute("data-element-id");
    if (id) return { elementId: id, handle: null };
  }
  return { elementId: null, handle: null };
}
