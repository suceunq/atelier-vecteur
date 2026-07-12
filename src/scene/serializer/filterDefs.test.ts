import { describe, expect, it } from "vitest";
import type { Filter } from "../types";
import { filtersToDefs } from "./filterDefs";

describe("filtersToDefs", () => {
  it("renders a blur filter", () => {
    const filter: Filter = { id: "abc", kind: "blur", blurRadius: 5, offsetX: 0, offsetY: 0, color: "#000", opacity: 1 };
    const out = filtersToDefs({ [filter.id]: filter });
    expect(out).toContain('id="filt-abc"');
    expect(out).toContain("feGaussianBlur");
    expect(out).toContain('stdDeviation="5"');
  });

  it("renders a drop-shadow filter", () => {
    const filter: Filter = { id: "def", kind: "shadow", blurRadius: 3, offsetX: 4, offsetY: 6, color: "#ff0000", opacity: 0.5 };
    const out = filtersToDefs({ [filter.id]: filter });
    expect(out).toContain("feDropShadow");
    expect(out).toContain('dx="4"');
    expect(out).toContain('dy="6"');
  });

  // Same class of finding fixed in gradientDefs.ts: this is rendered via dangerouslySetInnerHTML
  // in the live app and a loaded project file is unvalidated JSON.
  it("neutralizes a malicious filter id and non-numeric fields", () => {
    const malicious = {
      id: 'x"><script>alert(1)</script>',
      kind: "shadow",
      blurRadius: '1" onmouseover="alert(1)',
      offsetX: 4,
      offsetY: 4,
      color: { toString: () => '"><script>alert(2)</script>' },
      opacity: 1,
    } as unknown as Filter;

    const out = filtersToDefs({ x: malicious });
    expect(out).not.toContain("<script>");
    expect(out).not.toContain("onmouseover");
    expect(out).toMatch(/^<filter id="filt-[A-Za-z0-9_-]*"/);
  });
});
