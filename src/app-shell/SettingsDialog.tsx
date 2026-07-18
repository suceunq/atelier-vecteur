import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES, detectSystemLanguage, type LanguagePreference } from "../i18n";
import { useI18n } from "../i18n/useI18n";
import { useSettingsStore } from "../store/settingsStore";
import { isPayPalUrl } from "../config/donation";

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const theme = useSettingsStore((s) => s.theme);
  const preference = useSettingsStore((s) => s.languagePreference);
  const donationUrl = useSettingsStore((s) => s.donationUrl);
  const donationUrlOverride = useSettingsStore((s) => s.donationUrlOverride);
  const showWelcomeOnStartup = useSettingsStore((s) => s.showWelcomeOnStartup);
  const donationUrlIsValid = !donationUrlOverride || isPayPalUrl(donationUrlOverride);
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
    <div className="settings-section">
      <h4>{t("settings.donationTitle")}</h4>
      <label className="settings-url">{t("settings.donationUrl")}<input type="url" value={donationUrlOverride} placeholder="https://paypal.me/…" onChange={(e) => useSettingsStore.getState().setDonationUrl(e.target.value)} /></label>
      <p className="image-import-hint">{t("settings.donationHint")}</p>
      {!donationUrlOverride && donationUrl && <p className="settings-active-url">{t("settings.donationActive", { url: donationUrl })}</p>}
      {!donationUrlIsValid && <p className="image-import-error" role="alert">{t("settings.donationInvalid")}</p>}
    </div>
    <div className="dialog-actions"><button className="primary" onClick={onClose}>{t("common.close")}</button></div>
  </div></div>;
}
