import { describe, expect, it } from "vitest";
import { safeNumber } from "./sanitize";

describe("safeNumber", () => {
  it("passes through finite numbers", () => {
    expect(safeNumber(42)).toBe(42);
    expect(safeNumber(-3.5)).toBe(-3.5);
  });

  it("falls back for a malicious/non-numeric string instead of embedding it", () => {
    expect(safeNumber('1" onmouseover="alert(1)')).toBe(0);
    expect(safeNumber('1" onmouseover="alert(1)', 5)).toBe(5);
  });

  it("falls back for NaN, Infinity, null, undefined, objects", () => {
    expect(safeNumber(NaN)).toBe(0);
    expect(safeNumber(Infinity)).toBe(0);
    expect(safeNumber(null)).toBe(0);
    expect(safeNumber(undefined)).toBe(0);
    expect(safeNumber({})).toBe(0);
  });
});
