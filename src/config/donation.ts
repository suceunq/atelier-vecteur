const PAYPAL_HOSTS = new Set(["paypal.com", "www.paypal.com", "paypal.me", "www.paypal.me"]);

/** Only official HTTPS PayPal pages can be launched from the donation button. */
export function normalizePayPalUrl(value: string): string | null {
  const candidate = value.trim();
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || (!PAYPAL_HOSTS.has(host) && !host.endsWith(".paypal.com"))) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function isPayPalUrl(value: string): boolean {
  return normalizePayPalUrl(value) !== null;
}
