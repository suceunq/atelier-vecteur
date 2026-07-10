import { describe, expect, it } from "vitest";
import type { Gradient } from "../types";
import { gradientsToDefs } from "./gradientDefs";

describe("gradientsToDefs", () => {
  it("renders a well-formed gradient", () => {
    const gradient: Gradient = {
      id: "abc123",
      kind: "linear",
      from: { x: 0, y: 0 },
      to: { x: 10, y: 0 },
      stops: [
        { offset: 0, color: "#ff0000", opacity: 1 },
        { offset: 1, color: "#0000ff", opacity: 0.5 },
      ],
    };
    const out = gradientsToDefs({ [gradient.id]: gradient });
    expect(out).toContain('id="grad-abc123"');
    expect(out).toContain("<linearGradient");
    expect(out).toContain('stop-color="#ff0000"');
  });

  // Regression test for a real stored-XSS finding: a loaded `.svgatelier` project file is
  // unvalidated JSON, and this output is injected live via `dangerouslySetInnerHTML` in
  // SceneRenderer.tsx. A crafted gradient id or numeric field used to be interpolated verbatim,
  // letting a malicious project file break out of an attribute and inject arbitrary markup.
  it("neutralizes a malicious gradient id instead of breaking out of the id attribute", () => {
    const malicious = {
      id: 'x"><image href=1 onerror=alert(1)>',
      kind: "linear",
      from: { x: 0, y: 0 },
      to: { x: 10, y: 0 },
      stops: [
        { offset: 0, color: "#000", opacity: 1 },
        { offset: 1, color: "#fff", opacity: 1 },
      ],
    } as unknown as Gradient;

    const out = gradientsToDefs({ x: malicious });
    // The sanitized id keeps harmless alphanumeric characters (e.g. the literal word "onerror"
    // survives as inert text) — what matters is that the dangerous punctuation is gone, so it
    // can never form a real `<image>` element or a live `onerror=` attribute.
    expect(out).not.toContain("<image");
    expect(out).toMatch(/^<linearGradient id="grad-[A-Za-z0-9_-]*" /); // id value is a plain safe token
    expect(out.match(/<linearGradient/g)).toHaveLength(1); // no extra element was injected
  });

  it("coerces non-numeric coordinate/offset/opacity fields instead of embedding them raw", () => {
    const malicious = {
      id: "safe-id",
      kind: "radial",
      from: { x: '1" onmouseover="alert(1)', y: 0 },
      to: { x: 10, y: 0 },
      stops: [
        { offset: '0" foo="bar', color: "#000", opacity: 1 },
        { offset: 1, color: "#fff", opacity: 1 },
      ],
    } as unknown as Gradient;

    const out = gradientsToDefs({ "safe-id": malicious });
    expect(out).not.toContain("onmouseover");
    expect(out).not.toContain('foo="bar"');
  });

  it("falls back to a plain color instead of embedding a non-string stop color", () => {
    const malicious = {
      id: "safe-id-2",
      kind: "linear",
      from: { x: 0, y: 0 },
      to: { x: 1, y: 0 },
      stops: [
        { offset: 0, color: { toString: () => '"><script>alert(1)</script>' }, opacity: 1 },
        { offset: 1, color: "#fff", opacity: 1 },
      ],
    } as unknown as Gradient;

    const out = gradientsToDefs({ "safe-id-2": malicious });
    expect(out).not.toContain("<script>");
  });
});
