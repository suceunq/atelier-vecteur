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
});
