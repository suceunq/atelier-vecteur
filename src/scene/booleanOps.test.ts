import { describe, expect, it } from "vitest";
import { createRect, createEllipse, createLine } from "./factory";
import { defaultStyle } from "./types";
import { booleanOpToPathNode, isBooleanCapable, shapeToPolygon } from "./booleanOps";
import { worldBBox } from "./geometry";

describe("isBooleanCapable", () => {
  it("accepts rect, ellipse, polygon and path, rejects line/text/group/image", () => {
    expect(isBooleanCapable(createRect(0, 0, 10, 10))).toBe(true);
    expect(isBooleanCapable(createEllipse(0, 0, 5, 5))).toBe(true);
    expect(isBooleanCapable(createLine(0, 0, 10, 10))).toBe(false);
  });
});

describe("shapeToPolygon", () => {
  it("returns a single world-space region for an unrotated rect", () => {
    const rect = createRect(10, 20, 100, 50);
    const polygon = shapeToPolygon(rect);
    expect(polygon).not.toBeNull();
    expect(polygon!.regions).toHaveLength(1);
    const xs = polygon!.regions[0].map((p) => p[0]);
    const ys = polygon!.regions[0].map((p) => p[1]);
    expect(Math.min(...xs)).toBeCloseTo(10);
    expect(Math.max(...xs)).toBeCloseTo(110);
    expect(Math.min(...ys)).toBeCloseTo(20);
    expect(Math.max(...ys)).toBeCloseTo(70);
  });

  it("returns null for a line (no fillable interior)", () => {
    expect(shapeToPolygon(createLine(0, 0, 10, 10))).toBeNull();
  });
});

describe("booleanOpToPathNode", () => {
  it("unions two overlapping rects into a bbox spanning both", () => {
    const a = createRect(0, 0, 100, 100);
    const b = createRect(50, 50, 100, 100);
    const result = booleanOpToPathNode("union", [a, b], defaultStyle);
    expect(result).not.toBeNull();
    expect(worldBBox(result!)).toEqual({ x: 0, y: 0, width: 150, height: 150 });
  });

  it("subtracts the earlier (behind) shape from the later (topmost) one", () => {
    const back = createRect(0, 0, 100, 100);
    const front = createRect(0, 0, 50, 100);
    // front (last = topmost) minus back leaves nothing, since front is fully inside back
    const result = booleanOpToPathNode("subtract", [back, front], defaultStyle);
    expect(result).toBeNull();
  });

  it("intersecting non-overlapping rects yields nothing", () => {
    const a = createRect(0, 0, 10, 10);
    const b = createRect(100, 100, 10, 10);
    expect(booleanOpToPathNode("intersect", [a, b], defaultStyle)).toBeNull();
  });

  it("intersecting overlapping rects yields the overlap region", () => {
    const a = createRect(0, 0, 100, 100);
    const b = createRect(50, 50, 100, 100);
    const result = booleanOpToPathNode("intersect", [a, b], defaultStyle);
    expect(result).not.toBeNull();
    expect(worldBBox(result!)).toEqual({ x: 50, y: 50, width: 50, height: 50 });
  });

  it("returns null when fewer than two shapes have a usable polygon", () => {
    expect(booleanOpToPathNode("union", [createRect(0, 0, 10, 10)], defaultStyle)).toBeNull();
  });
});
