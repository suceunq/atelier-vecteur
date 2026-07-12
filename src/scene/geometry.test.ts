import { describe, expect, it } from "vitest";
import { createEllipse, createGroup, createRect } from "./factory";
import {
  localBBox,
  localCenter,
  localToWorldPoint,
  rotatedOutlineCorners,
  unionBBox,
  worldBBox,
  worldHandlePosition,
  worldToLocal,
} from "./geometry";

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

describe("localToWorldPoint / worldToLocal (scaled nodes)", () => {
  // Regression test: a scaled group's selection outline/handles used to be computed via
  // localToWorldPoint, which ignored transform.scaleX/scaleY entirely (only rotation+translate),
  // while worldBBox correctly applied scale — so a scaled-down imported image rendered small but
  // showed a selection box sized as if scale were 1. Both must now agree.
  it("localToWorldPoint applies scale, matching worldBBox's own corners", () => {
    const group = createGroup([createRect(0, 0, 100, 50)]);
    group.transform.scaleX = 0.5;
    group.transform.scaleY = 0.25;
    group.transform.x = 40;
    group.transform.y = 30;

    const corners = rotatedOutlineCorners(group);
    const box = worldBBox(group);
    const xs = corners.map((p) => p.x);
    const ys = corners.map((p) => p.y);
    expect(Math.min(...xs)).toBeCloseTo(box.x);
    expect(Math.min(...ys)).toBeCloseTo(box.y);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(box.width);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(box.height);
  });

  it("worldHandlePosition('se') lands on worldBBox's bottom-right corner for a scaled, unrotated node", () => {
    const group = createGroup([createRect(0, 0, 100, 50)]);
    group.transform.scaleX = 2;
    group.transform.scaleY = 3;
    const box = worldBBox(group);
    const se = worldHandlePosition(group, "se");
    expect(se.x).toBeCloseTo(box.x + box.width);
    expect(se.y).toBeCloseTo(box.y + box.height);
  });

  it("worldToLocal is the exact inverse of localToWorldPoint under scale", () => {
    const group = createGroup([createRect(0, 0, 100, 50)]);
    group.transform.scaleX = 0.3125;
    group.transform.scaleY = 0.3125;
    group.transform.x = 150;
    group.transform.y = 112.5;

    const localPoint = { x: 37, y: -12 };
    const world = localToWorldPoint(group, localPoint);
    const back = worldToLocal(group, world);
    expect(back.x).toBeCloseTo(localPoint.x);
    expect(back.y).toBeCloseTo(localPoint.y);
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
