import { create } from "zustand";
import { detectSystemLanguage, setActiveLanguage, SUPPORTED_LANGUAGES, type Language, type LanguagePreference } from "../i18n";

export type Theme = "light" | "dark";
const THEME_KEY = "atelier-vecteur:theme";
const LANGUAGE_KEY = "atelier-vecteur:language";
const WELCOME_KEY = "atelier-vecteur:show-welcome";
const DONATION_URL_KEY = "atelier-vecteur:donation-url";

function readStored<T extends string>(key: string, accepted: readonly T[], fallback: T): T {
  try { const value = localStorage.getItem(key) as T; if (accepted.includes(value)) return value; } catch { /* unavailable */ }
  return fallback;
}
function readBoolean(key: string, fallback: boolean): boolean {
  try { const value = localStorage.getItem(key); if (value === "true" || value === "false") return value === "true"; } catch { /* unavailable */ }
  return fallback;
}
function readString(key: string): string {
  try { return localStorage.getItem(key)?.trim() ?? ""; } catch { return ""; }
}
function resolveLanguage(preference: LanguagePreference): Language { return preference === "system" ? detectSystemLanguage() : preference; }
function apply(theme: Theme, language: Language) {
  if (typeof document !== "undefined") { document.documentElement.dataset.theme = theme; document.documentElement.lang = language; }
  setActiveLanguage(language);
}

interface SettingsState {
  theme: Theme; languagePreference: LanguagePreference; resolvedLanguage: Language;
  showWelcomeOnStartup: boolean; donationUrl: string; donationUrlOverride: string; remoteDonationUrl: string;
  setTheme: (theme: Theme) => void; toggleTheme: () => void; setLanguagePreference: (language: LanguagePreference) => void;
  setShowWelcomeOnStartup: (show: boolean) => void; setDonationUrl: (url: string) => void; setRemoteDonationUrl: (url: string) => void;
}
const initialTheme = readStored(THEME_KEY, ["light", "dark"] as const, "light");
const initialPreference = readStored(LANGUAGE_KEY, ["system", ...SUPPORTED_LANGUAGES] as const, "system");
const initialLanguage = resolveLanguage(initialPreference);
const initialShowWelcome = readBoolean(WELCOME_KEY, true);
const initialDonationUrlOverride = readString(DONATION_URL_KEY);
apply(initialTheme, initialLanguage);

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: initialTheme, languagePreference: initialPreference, resolvedLanguage: initialLanguage,
  showWelcomeOnStartup: initialShowWelcome, donationUrl: initialDonationUrlOverride, donationUrlOverride: initialDonationUrlOverride, remoteDonationUrl: "",
  setTheme: (theme) => { set({ theme }); apply(theme, get().resolvedLanguage); try { localStorage.setItem(THEME_KEY, theme); } catch { /* no persistence */ } },
  toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
  setLanguagePreference: (languagePreference) => {
    const resolvedLanguage = resolveLanguage(languagePreference); set({ languagePreference, resolvedLanguage }); apply(get().theme, resolvedLanguage);
    try { localStorage.setItem(LANGUAGE_KEY, languagePreference); } catch { /* no persistence */ }
  },
  setShowWelcomeOnStartup: (showWelcomeOnStartup) => {
    set({ showWelcomeOnStartup });
    try { localStorage.setItem(WELCOME_KEY, String(showWelcomeOnStartup)); } catch { /* no persistence */ }
  },
  setDonationUrl: (value) => {
    const donationUrlOverride = value.trim();
    set((state) => ({ donationUrlOverride, donationUrl: donationUrlOverride || state.remoteDonationUrl }));
    try { localStorage.setItem(DONATION_URL_KEY, donationUrlOverride); } catch { /* no persistence */ }
  },
  setRemoteDonationUrl: (remoteDonationUrl) => {
    set((state) => ({ remoteDonationUrl, donationUrl: state.donationUrlOverride || remoteDonationUrl }));
  },
}));
