import { beforeEach, describe, expect, it } from "vitest";
import { useSettingsStore } from "./settingsStore";

const REMOTE = "https://paypal.me/shared-project";
const LOCAL = "https://www.paypal.com/donate/?hosted_button_id=LOCAL";

describe("welcome and donation settings", () => {
  beforeEach(() => {
    useSettingsStore.getState().setDonationUrl("");
    useSettingsStore.getState().setRemoteDonationUrl("");
    useSettingsStore.getState().setShowWelcomeOnStartup(true);
  });

  it("uses the remotely managed donation link by default", () => {
    useSettingsStore.getState().setRemoteDonationUrl(REMOTE);
    expect(useSettingsStore.getState().donationUrl).toBe(REMOTE);
  });

  it("prefers a local override and returns to the shared link when cleared", () => {
    useSettingsStore.getState().setRemoteDonationUrl(REMOTE);
    useSettingsStore.getState().setDonationUrl(LOCAL);
    expect(useSettingsStore.getState().donationUrl).toBe(LOCAL);
    useSettingsStore.getState().setDonationUrl("");
    expect(useSettingsStore.getState().donationUrl).toBe(REMOTE);
  });

  it("stores the welcome visibility preference in application state", () => {
    useSettingsStore.getState().setShowWelcomeOnStartup(false);
    expect(useSettingsStore.getState().showWelcomeOnStartup).toBe(false);
  });
});
