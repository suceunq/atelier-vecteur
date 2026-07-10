import type { Point } from "../scene/types";

export interface Viewport {
  pan: Point;
  zoom: number;
}

export function screenToUser(screenPoint: Point, viewport: Viewport): Point {
  return {
    x: (screenPoint.x - viewport.pan.x) / viewport.zoom,
    y: (screenPoint.y - viewport.pan.y) / viewport.zoom,
  };
}

export function userToScreen(userPoint: Point, viewport: Viewport): Point {
  return {
    x: userPoint.x * viewport.zoom + viewport.pan.x,
    y: userPoint.y * viewport.zoom + viewport.pan.y,
  };
}

/** SVG `transform` for the group that maps user-space content into the pan/zoomed viewport. */
export function svgGroupTransform(viewport: Viewport): string {
  return `translate(${viewport.pan.x} ${viewport.pan.y}) scale(${viewport.zoom})`;
}
