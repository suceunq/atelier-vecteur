import { describe, expect, it } from "vitest";
import { donationUrlFromConfig } from "./runtimeConfig";

describe("runtime donation configuration", () => {
  it("reads an official PayPal URL", () => {
    expect(donationUrlFromConfig({ donationUrl: "https://www.paypal.com/donate/?hosted_button_id=ABC" }))
      .toBe("https://www.paypal.com/donate/?hosted_button_id=ABC");
  });

  it("ignores missing, malformed and untrusted values", () => {
    expect(donationUrlFromConfig(null)).toBeNull();
    expect(donationUrlFromConfig({ donationUrl: 42 })).toBeNull();
    expect(donationUrlFromConfig({ donationUrl: "https://example.org/donate" })).toBeNull();
  });

  it("accepts the project's merchant-ID donation page", () => {
    expect(donationUrlFromConfig({ donationUrl: "https://www.paypal.com/donate/?business=X65TNHGN5K7QA&no_recurring=0&item_name=Atelier%20Vecteur&currency_code=EUR" }))
      .toBe("https://www.paypal.com/donate/?business=X65TNHGN5K7QA&no_recurring=0&item_name=Atelier%20Vecteur&currency_code=EUR");
  });
});
