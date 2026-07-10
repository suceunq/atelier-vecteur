import type { Point } from "../scene/types";

export interface RectBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Bounding rect between two drag points; shift constrains to a square. */
export function rectFromDrag(a: Point, b: Point, constrainSquare: boolean): RectBounds {
  let width = Math.abs(b.x - a.x);
  let height = Math.abs(b.y - a.y);
  if (constrainSquare) {
    const side = Math.max(width, height);
    width = side;
    height = side;
  }
  const x = b.x < a.x ? a.x - width : a.x;
  const y = b.y < a.y ? a.y - height : a.y;
  return { x, y, width, height };
}
