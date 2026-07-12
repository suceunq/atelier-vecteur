import { describe, expect, it } from "vitest";
import { sanitizeImageHref } from "./imageHref";

describe("sanitizeImageHref", () => {
  it("accepts a well-formed base64 image data URI", () => {
    const href = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB";
    expect(sanitizeImageHref(href)).toBe(href);
  });

  it("rejects a javascript: URI", () => {
    expect(sanitizeImageHref("javascript:alert(1)")).toBe("");
  });

  it("rejects a data URI with an injected attribute breakout", () => {
    expect(sanitizeImageHref('data:image/png;base64,abc" onerror="alert(1)')).toBe("");
  });

  it("rejects a non-image mime type", () => {
    expect(sanitizeImageHref("data:text/html;base64,PHNjcmlwdD4=")).toBe("");
  });

  it("rejects non-string input", () => {
    expect(sanitizeImageHref(undefined)).toBe("");
    expect(sanitizeImageHref(42)).toBe("");
  });
});
