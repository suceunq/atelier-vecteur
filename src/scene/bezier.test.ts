import { describe, expect, it } from "vitest";
import { cubicPoint, flattenCubic, pathSegments, pathToD, subdivideCubic } from "./bezier";
import type { PathAnchor, PathNode } from "./types";
import { defaultStyle, defaultTransform } from "./types";

describe("cubicPoint", () => {
  it("returns p0 at t=0 and p3 at t=1", () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 10, y: 20 };
    const p2 = { x: 20, y: 20 };
    const p3 = { x: 30, y: 0 };
    expect(cubicPoint(p0, p1, p2, p3, 0)).toEqual(p0);
    expect(cubicPoint(p0, p1, p2, p3, 1)).toEqual(p3);
  });

  it("matches the straight line midpoint when control points are collinear", () => {
    const p0 = { x: 0, y: 0 };
    const p3 = { x: 10, y: 0 };
    const mid = cubicPoint(p0, { x: 3.33, y: 0 }, { x: 6.66, y: 0 }, p3, 0.5);
    expect(mid.x).toBeCloseTo(5, 1);
    expect(mid.y).toBeCloseTo(0, 5);
  });
});

describe("flattenCubic", () => {
  it("starts and ends on the curve's endpoints", () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 0, y: 10 };
    const p2 = { x: 10, y: 10 };
    const p3 = { x: 10, y: 0 };
    const points = flattenCubic(p0, p1, p2, p3, 10);
    expect(points[0]).toEqual(p0);
    expect(points[points.length - 1]).toEqual(p3);
    expect(points.length).toBe(11);
  });
});

describe("subdivideCubic", () => {
  it("splits into two segments that share the exact point-on-curve at t", () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 0, y: 10 };
    const p2 = { x: 10, y: 10 };
    const p3 = { x: 10, y: 0 };
    const t = 0.4;
    const expected = cubicPoint(p0, p1, p2, p3, t);
    const { left, right } = subdivideCubic(p0, p1, p2, p3, t);
    expect(left[3]).toEqual(right[0]);
    expect(left[3].x).toBeCloseTo(expected.x, 5);
    expect(left[3].y).toBeCloseTo(expected.y, 5);
    expect(left[0]).toEqual(p0);
    expect(right[3]).toEqual(p3);
  });
});

function makeAnchor(x: number, y: number): PathAnchor {
  return { id: `${x},${y}`, anchor: { x, y }, handleIn: null, handleOut: null, type: "corner" };
}

function makePath(nodes: PathAnchor[], closed = false): PathNode {
  return {
    id: "path-1",
    type: "path",
    transform: { ...defaultTransform },
    style: { ...defaultStyle },
    nodes,
    closed,
  };
}

describe("pathSegments", () => {
  it("produces N-1 segments for an open path", () => {
    const path = makePath([makeAnchor(0, 0), makeAnchor(10, 0), makeAnchor(10, 10)], false);
    expect(pathSegments(path)).toHaveLength(2);
  });

  it("produces N segments (including the closing one) for a closed path", () => {
    const path = makePath([makeAnchor(0, 0), makeAnchor(10, 0), makeAnchor(10, 10)], true);
    expect(pathSegments(path)).toHaveLength(3);
  });

  it("marks a segment as a line when neither endpoint has a handle", () => {
    const path = makePath([makeAnchor(0, 0), makeAnchor(10, 0)], false);
    expect(pathSegments(path)[0].isLine).toBe(true);
  });
});

describe("pathToD", () => {
  it("emits M/L for straight segments, an explicit closing segment, then Z", () => {
    // The explicit closing L (not just Z) matters once that segment is curved — Z alone only
    // guarantees a straight close, so pathToD always emits the real segment and trails Z after.
    const path = makePath([makeAnchor(0, 0), makeAnchor(10, 0), makeAnchor(10, 10)], true);
    expect(pathToD(path)).toBe("M 0 0 L 10 0 L 10 10 L 0 0 Z");
  });

  it("emits a C command when a handle is present", () => {
    const a = makeAnchor(0, 0);
    a.handleOut = { x: 5, y: 0 };
    const b = makeAnchor(10, 0);
    const path = makePath([a, b], false);
    expect(pathToD(path)).toBe("M 0 0 C 5 0 10 0 10 0");
  });
});
