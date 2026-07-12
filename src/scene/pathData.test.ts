import { describe, expect, it } from "vitest";
import { parsePathData, parseTracedSvg } from "./pathData";

describe("parsePathData", () => {
  it("parses a closed square of straight lines", () => {
    const [subpath] = parsePathData("M0 0 L10 0 L10 10 L0 10 Z");
    expect(subpath.closed).toBe(true);
    expect(subpath.nodes).toHaveLength(4);
    expect(subpath.nodes.map((n) => n.anchor)).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]);
    expect(subpath.nodes.every((n) => n.handleIn === null && n.handleOut === null)).toBe(true);
  });

  it("parses a cubic curve into relative handles", () => {
    const [subpath] = parsePathData("M0,0 C0,10 10,10 10,0");
    expect(subpath.closed).toBe(false);
    expect(subpath.nodes).toHaveLength(2);
    expect(subpath.nodes[0].handleOut).toEqual({ x: 0, y: 10 });
    expect(subpath.nodes[1].handleIn).toEqual({ x: 0, y: 10 });
  });

  it("drops a redundant closing anchor that duplicates the start point before Z", () => {
    const [subpath] = parsePathData("M0,0 L10,0 L10,10 L0,0 Z");
    expect(subpath.nodes).toHaveLength(3);
    expect(subpath.closed).toBe(true);
  });

  it("converts a quadratic curve to an equivalent cubic", () => {
    const [subpath] = parsePathData("M0,0 Q5,10 10,0");
    // c1 = p0 + 2/3(q-p0); c2 = p1 + 2/3(q-p1) — handles stored relative to their own anchor.
    const c2x = 10 + (2 / 3) * (5 - 10);
    const c2y = 0 + (2 / 3) * (10 - 0);
    expect(subpath.nodes[0].handleOut).toEqual({ x: (2 / 3) * 5, y: (2 / 3) * 10 });
    expect(subpath.nodes[1].handleIn).toEqual({ x: c2x - 10, y: c2y - 0 });
  });

  it("never throws on an unrecognized command", () => {
    expect(() => parsePathData("M0 0 X99 99")).not.toThrow();
  });
});

describe("parseTracedSvg", () => {
  it("parses vtracer's known <path> output format", () => {
    const svg =
      '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="10" height="10">' +
      '<path d="M0 0L10 0L10 10L0 10Z" fill="#ff0000" transform="translate(0,0)"/>' +
      "</svg>";
    const shapes = parseTracedSvg(svg);
    expect(shapes).toHaveLength(1);
    expect(shapes[0].fill).toBe("#ff0000");
    expect(shapes[0].x).toBe(0);
    expect(shapes[0].y).toBe(0);
    expect(shapes[0].subpaths[0].nodes).toHaveLength(4);
  });

  it("falls back to a safe color when the fill doesn't match a plausible CSS color", () => {
    const svg =
      '<path d="M0 0L1 0L1 1Z" fill="red onload=alert(1)" transform="translate(0,0)"/>';
    const shapes = parseTracedSvg(svg);
    expect(shapes[0].fill).toBe("#808080");
  });
});
