import { describe, expect, it } from "vitest";
import { createEmptyScene } from "./factory";
import { isPlausibleScene } from "./validate";

describe("isPlausibleScene", () => {
  it("accepts a well-formed scene", () => {
    expect(isPlausibleScene(createEmptyScene())).toBe(true);
  });

  it("rejects non-objects", () => {
    expect(isPlausibleScene(null)).toBe(false);
    expect(isPlausibleScene("scene")).toBe(false);
    expect(isPlausibleScene(42)).toBe(false);
    expect(isPlausibleScene(undefined)).toBe(false);
  });

  it("rejects a scene missing required fields", () => {
    expect(isPlausibleScene({})).toBe(false);
    expect(isPlausibleScene({ artboards: [{ width: 1, height: 1 }] })).toBe(false);
    expect(
      isPlausibleScene({ artboards: [{ width: 1, height: 1 }], layers: [], elements: {} })
    ).toBe(false);
  });

  it("rejects a scene with the wrong field types", () => {
    expect(
      isPlausibleScene({
        artboards: [{ width: "800", height: 600 }],
        layers: [],
        elements: {},
        gradients: {},
        patterns: {},
        filters: {},
      })
    ).toBe(false);
    expect(
      isPlausibleScene({
        artboards: [{ width: 800, height: 600 }],
        layers: "not-an-array",
        elements: {},
        gradients: {},
        patterns: {},
        filters: {},
      })
    ).toBe(false);
    expect(
      isPlausibleScene({
        artboards: [],
        layers: [],
        elements: {},
        gradients: {},
        patterns: {},
        filters: {},
      })
    ).toBe(false);
  });

  it("rejects dangling element references", () => {
    const scene = createEmptyScene();
    scene.layers[0].elementIds.push("missing");
    expect(isPlausibleScene(scene)).toBe(false);
  });

  it("rejects invalid dimensions and non-finite numbers", () => {
    const scene = createEmptyScene();
    scene.artboards[0].width = 0;
    expect(isPlausibleScene(scene)).toBe(false);
    scene.artboards[0].width = Number.NaN;
    expect(isPlausibleScene(scene)).toBe(false);
  });

  it("rejects cyclic groups", () => {
    const scene = createEmptyScene();
    const base = {
      transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
      style: { fill: "none", fillOpacity: 1, stroke: "none", strokeWidth: 0, strokeOpacity: 1, strokeDasharray: null, opacity: 1, filter: null, fillRule: "nonzero" as const },
      bounds: { x: 0, y: 0, width: 1, height: 1 },
    };
    scene.elements.a = { ...base, id: "a", type: "group", childIds: ["b"] };
    scene.elements.b = { ...base, id: "b", type: "group", childIds: ["a"] };
    scene.layers[0].elementIds.push("a");
    expect(isPlausibleScene(scene)).toBe(false);
  });
});
