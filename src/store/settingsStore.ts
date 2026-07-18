import { create } from "zustand";
import { detectSystemLanguage, setActiveLanguage, SUPPORTED_LANGUAGES, type Language, type LanguagePreference } from "../i18n";

export type Theme = "light" | "dark";
const THEME_KEY = "atelier-vecteur:theme";
const LANGUAGE_KEY = "atelier-vecteur:language";

function readStored<T extends string>(key: string, accepted: readonly T[], fallback: T): T {
  try { const value = localStorage.getItem(key) as T; if (accepted.includes(value)) return value; } catch { /* unavailable */ }
  return fallback;
}
function resolveLanguage(preference: LanguagePreference): Language { return preference === "system" ? detectSystemLanguage() : preference; }
function apply(theme: Theme, language: Language) {
  if (typeof document !== "undefined") { document.documentElement.dataset.theme = theme; document.documentElement.lang = language; }
  setActiveLanguage(language);
}

interface SettingsState {
  theme: Theme; languagePreference: LanguagePreference; resolvedLanguage: Language;
  setTheme: (theme: Theme) => void; toggleTheme: () => void; setLanguagePreference: (language: LanguagePreference) => void;
}
const initialTheme = readStored(THEME_KEY, ["light", "dark"] as const, "light");
const initialPreference = readStored(LANGUAGE_KEY, ["system", ...SUPPORTED_LANGUAGES] as const, "system");
const initialLanguage = resolveLanguage(initialPreference);
apply(initialTheme, initialLanguage);

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: initialTheme, languagePreference: initialPreference, resolvedLanguage: initialLanguage,
  setTheme: (theme) => { set({ theme }); apply(theme, get().resolvedLanguage); try { localStorage.setItem(THEME_KEY, theme); } catch { /* no persistence */ } },
  toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
  setLanguagePreference: (languagePreference) => {
    const resolvedLanguage = resolveLanguage(languagePreference); set({ languagePreference, resolvedLanguage }); apply(get().theme, resolvedLanguage);
    try { localStorage.setItem(LANGUAGE_KEY, languagePreference); } catch { /* no persistence */ }
  },
}));
