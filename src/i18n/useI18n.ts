import { useCallback } from "react";
import { useSettingsStore } from "../store/settingsStore";
import { t, type MessageKey, type TranslationParams } from ".";

export function useI18n() {
  const language = useSettingsStore((state) => state.resolvedLanguage);
  return {
    language,
    t: useCallback((key: MessageKey, params?: TranslationParams) => t(key, params, language), [language]),
  };
}
