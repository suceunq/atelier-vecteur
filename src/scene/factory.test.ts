import { describe, expect, it } from "vitest";
import { cloneNodeWithOffset, createRect } from "./factory";

describe("cloneNodeWithOffset", () => {
  it("produces a new id and an offset position, leaving the original untouched", () => {
    const original = createRect(10, 20, 100, 50);
    const clone = cloneNodeWithOffset(original, 5, 7);

    expect(clone.id).not.toBe(original.id);
    expect(clone.transform.x).toBe(15);
    expect(clone.transform.y).toBe(27);
    expect(original.transform.x).toBe(10);
    expect(original.transform.y).toBe(20);
  });

  it("regenerates path anchor ids (across every subpath) so they don't collide with the source path's anchors", () => {
    const path = {
      id: "p1",
      type: "path" as const,
      transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
      style: {
        fill: "#000",
        fillOpacity: 1,
        stroke: "none",
        strokeWidth: 1,
        strokeOpacity: 1,
        strokeDasharray: null,
        opacity: 1,
        filter: null,
        fillRule: "nonzero" as const,
      },
      subpaths: [
        {
          nodes: [
            { id: "a1", anchor: { x: 0, y: 0 }, handleIn: null, handleOut: null, type: "corner" as const },
            { id: "a2", anchor: { x: 10, y: 0 }, handleIn: null, handleOut: null, type: "corner" as const },
          ],
          closed: false,
        },
        {
          nodes: [
            { id: "b1", anchor: { x: 5, y: 5 }, handleIn: null, handleOut: null, type: "corner" as const },
          ],
          closed: false,
        },
      ],
    };

    const clone = cloneNodeWithOffset(path, 0, 0);
    expect(clone.type).toBe("path");
    if (clone.type === "path") {
      expect(clone.subpaths[0].nodes[0].id).not.toBe("a1");
      expect(clone.subpaths[0].nodes[1].id).not.toBe("a2");
      expect(clone.subpaths[1].nodes[0].id).not.toBe("b1");
    }
  });
});
