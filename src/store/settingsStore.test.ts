import { beforeEach, describe, expect, it } from "vitest";
import { useSettingsStore } from "./settingsStore";

const REMOTE = "https://paypal.me/shared-project";

describe("welcome and donation settings", () => {
  beforeEach(() => {
    useSettingsStore.getState().setRemoteDonationUrl("");
    useSettingsStore.getState().setShowWelcomeOnStartup(true);
  });

  it("uses the remotely managed donation link by default", () => {
    useSettingsStore.getState().setRemoteDonationUrl(REMOTE);
    expect(useSettingsStore.getState().donationUrl).toBe(REMOTE);
  });

  it("replaces the donation link only through shared configuration", () => {
    useSettingsStore.getState().setRemoteDonationUrl(REMOTE);
    useSettingsStore.getState().setRemoteDonationUrl("https://paypal.me/new-shared-project");
    expect(useSettingsStore.getState().donationUrl).toBe("https://paypal.me/new-shared-project");
  });

  it("stores the welcome visibility preference in application state", () => {
    useSettingsStore.getState().setShowWelcomeOnStartup(false);
    expect(useSettingsStore.getState().showWelcomeOnStartup).toBe(false);
  });
});
