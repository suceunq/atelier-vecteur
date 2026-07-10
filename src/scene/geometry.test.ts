import { describe, expect, it } from "vitest";
import { createEllipse, createRect } from "./factory";
import { localBBox, localCenter, unionBBox, worldBBox } from "./geometry";

describe("localBBox", () => {
  it("computes a rect's local bbox from its origin", () => {
    const rect = createRect(10, 20, 100, 50);
    expect(localBBox(rect)).toEqual({ x: 0, y: 0, width: 100, height: 50 });
  });

  it("computes an ellipse's local bbox centered on its own origin", () => {
    const ellipse = createEllipse(0, 0, 30, 20);
    expect(localBBox(ellipse)).toEqual({ x: -30, y: -20, width: 60, height: 40 });
  });
});

describe("localCenter", () => {
  it("is the rect's geometric center regardless of position", () => {
    const rect = createRect(10, 20, 100, 50);
    expect(localCenter(rect)).toEqual({ x: 50, y: 25 });
  });
});

describe("worldBBox", () => {
  it("matches localBBox translated by transform.x/y when unrotated", () => {
    const rect = createRect(10, 20, 100, 50);
    expect(worldBBox(rect)).toEqual({ x: 10, y: 20, width: 100, height: 50 });
  });

  it("grows to the axis-aligned bounds of a 45deg-rotated square", () => {
    const rect = createRect(0, 0, 100, 100);
    rect.transform.rotation = 45;
    const box = worldBBox(rect);
    const diagonal = 100 * Math.SQRT2;
    expect(box.width).toBeCloseTo(diagonal, 5);
    expect(box.height).toBeCloseTo(diagonal, 5);
  });
});

describe("unionBBox", () => {
  it("returns null for an empty list", () => {
    expect(unionBBox([])).toBeNull();
  });

  it("encloses all given boxes", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 20, y: 5, width: 10, height: 10 };
    expect(unionBBox([a, b])).toEqual({ x: 0, y: 0, width: 30, height: 15 });
  });
});
