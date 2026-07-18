import { normalizePayPalUrl } from "./donation";

export const REMOTE_CONFIG_URL = "https://raw.githubusercontent.com/suceunq/atelier-vecteur/master/public/runtime-config.json";

export function donationUrlFromConfig(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("donationUrl" in value)) return null;
  const donationUrl = (value as { donationUrl: unknown }).donationUrl;
  return typeof donationUrl === "string" ? normalizePayPalUrl(donationUrl) : null;
}

/** Loads the project owner's shared configuration without delaying application startup. */
export async function loadRemoteDonationUrl(): Promise<string | null> {
  try {
    const response = await fetch(REMOTE_CONFIG_URL, { cache: "no-store" });
    if (response.ok) return donationUrlFromConfig(await response.json());
  } catch {
    // Offline startup falls back to the configuration bundled with the installer.
  }
  try {
    const response = await fetch("./runtime-config.json", { cache: "no-store" });
    return response.ok ? donationUrlFromConfig(await response.json()) : null;
  } catch {
    return null;
  }
}
