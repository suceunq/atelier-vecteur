import type { Point } from "../scene/types";

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function addPoints(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subPoints(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function rotatePoint(point: Point, center: Point, angleDeg: number): Point {
  if (angleDeg === 0) return point;
  const rad = degToRad(angleDeg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/** Angle in degrees of the vector from `center` to `point`, 0 = pointing up (+Y is down in SVG space). */
export function angleFromCenter(center: Point, point: Point): number {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return radToDeg(Math.atan2(dx, -dy));
}

export function snapAngle(angleDeg: number, step = 15): number {
  return Math.round(angleDeg / step) * step;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
