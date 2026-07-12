import { create } from "zustand";

export type Theme = "light" | "dark";

const STORAGE_KEY = "atelier-vecteur:theme";

function loadInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage unavailable (e.g. private browsing) — fall back to light
  }
  return "light";
}

function applyThemeToDocument(theme: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
  }
}

interface SettingsState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const initialTheme = loadInitialTheme();
applyThemeToDocument(initialTheme);

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: initialTheme,
  setTheme: (theme) => {
    set({ theme });
    applyThemeToDocument(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore — theme just won't persist across restarts
    }
  },
  toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
}));
