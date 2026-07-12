import { describe, expect, it } from "vitest";
import type { Pattern } from "../types";
import { patternsToDefs } from "./patternDefs";

describe("patternsToDefs", () => {
  it("renders a dots pattern", () => {
    const pattern: Pattern = { id: "abc", kind: "dots", size: 12, color: "#3b82f6", background: "#ffffff" };
    const out = patternsToDefs({ [pattern.id]: pattern });
    expect(out).toContain('id="pat-abc"');
    expect(out).toContain("<circle");
  });

  it("renders each pattern kind without throwing", () => {
    const kinds: Pattern["kind"][] = ["dots", "stripes", "grid", "checkerboard"];
    for (const kind of kinds) {
      const pattern: Pattern = { id: kind, kind, size: 10, color: "#000", background: "#fff" };
      expect(() => patternsToDefs({ [pattern.id]: pattern })).not.toThrow();
    }
  });

  it("neutralizes a malicious pattern id and non-numeric size", () => {
    const malicious = {
      id: 'x"><script>alert(1)</script>',
      kind: "grid",
      size: '10" onmouseover="alert(1)',
      color: "#000",
      background: "#fff",
    } as unknown as Pattern;

    const out = patternsToDefs({ x: malicious });
    expect(out).not.toContain("<script>");
    expect(out).not.toContain("onmouseover");
    expect(out).toMatch(/^<pattern id="pat-[A-Za-z0-9_-]*"/);
  });
});
