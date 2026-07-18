import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES, detectSystemLanguage, type LanguagePreference } from "../i18n";
import { useI18n } from "../i18n/useI18n";
import { useSettingsStore } from "../store/settingsStore";

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const theme = useSettingsStore((s) => s.theme);
  const preference = useSettingsStore((s) => s.languagePreference);
  const showWelcomeOnStartup = useSettingsStore((s) => s.showWelcomeOnStartup);
  return <div className="dialog-overlay" onClick={onClose}><div className="dialog settings-dialog" onClick={(e) => e.stopPropagation()}>
    <div className="about-header"><h3>{t("settings.title")}</h3><button className="about-close" onClick={onClose} aria-label={t("common.close")}>×</button></div>
    <label>{t("settings.language")}<select value={preference} onChange={(e) => useSettingsStore.getState().setLanguagePreference(e.target.value as LanguagePreference)}>
      <option value="system">{t("settings.systemLanguage", { language: LANGUAGE_NAMES[detectSystemLanguage()] })}</option>
      {SUPPORTED_LANGUAGES.map((language) => <option key={language} value={language}>{LANGUAGE_NAMES[language]}</option>)}
    </select></label>
    <p className="image-import-hint">{t("settings.languageHint")}</p>
    <label>{t("settings.theme")}<select value={theme} onChange={(e) => useSettingsStore.getState().setTheme(e.target.value as "light" | "dark")}><option value="light">{t("settings.light")}</option><option value="dark">{t("settings.dark")}</option></select></label>
    <div className="settings-section">
      <h4>{t("settings.welcomeTitle")}</h4>
      <label className="settings-checkbox"><input type="checkbox" checked={showWelcomeOnStartup} onChange={(e) => useSettingsStore.getState().setShowWelcomeOnStartup(e.target.checked)} />{t("welcome.showOnStartup")}</label>
    </div>
    <div className="dialog-actions"><button className="primary" onClick={onClose}>{t("common.close")}</button></div>
  </div></div>;
}
