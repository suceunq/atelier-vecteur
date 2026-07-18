import { describe, expect, it } from "vitest";
import { isPayPalUrl, normalizePayPalUrl } from "./donation";

describe("PayPal donation URL", () => {
  it("accepts official PayPal.me and hosted donation pages", () => {
    expect(isPayPalUrl("https://paypal.me/atelier-vecteur")).toBe(true);
    expect(isPayPalUrl("https://www.paypal.com/donate/?hosted_button_id=ABC123")).toBe(true);
  });

  it("rejects non-HTTPS, lookalike and malformed URLs", () => {
    expect(isPayPalUrl("http://paypal.me/example")).toBe(false);
    expect(isPayPalUrl("https://paypal.example.com/donate")).toBe(false);
    expect(isPayPalUrl("https://paypal.com.example.org/donate")).toBe(false);
    expect(normalizePayPalUrl("not a url")).toBeNull();
  });
});
