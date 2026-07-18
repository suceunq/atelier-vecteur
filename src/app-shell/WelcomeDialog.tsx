import { useEffect, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import appIcon from "../assets/app-icon.png";
import { normalizePayPalUrl } from "../config/donation";
import { useI18n } from "../i18n/useI18n";
import { useSettingsStore } from "../store/settingsStore";

interface WelcomeDialogProps {
  onClose: () => void;
}

export function WelcomeDialog({ onClose }: WelcomeDialogProps) {
  const { t } = useI18n();
  const donationUrl = useSettingsStore((state) => state.donationUrl);
  const showOnStartup = useSettingsStore((state) => state.showWelcomeOnStartup);
  const [error, setError] = useState("");
  const validDonationUrl = normalizePayPalUrl(donationUrl);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const donate = async () => {
    if (!validDonationUrl) return;
    setError("");
    try {
      await openUrl(validDonationUrl);
    } catch {
      setError(t("error.donationOpen"));
    }
  };

  return <div className="dialog-overlay welcome-overlay" onClick={onClose}>
    <section className="dialog welcome-dialog" role="dialog" aria-modal="true" aria-labelledby="welcome-title" onClick={(event) => event.stopPropagation()}>
      <button className="about-close welcome-close" onClick={onClose} aria-label={t("common.close")}>×</button>
      <header className="welcome-hero">
        <img src={appIcon} alt="" className="welcome-icon" />
        <div><span className="welcome-eyebrow">{t("welcome.eyebrow")}</span><h2 id="welcome-title">{t("welcome.title")}</h2></div>
      </header>
      <div className="welcome-content">
        <p className="welcome-intro">{t("welcome.intro")}</p>
        <p>{t("welcome.thanks")}</p>
        <div className="welcome-support">
          <div className="welcome-support-icon" aria-hidden="true">♥</div>
          <div><h3>{t("welcome.supportTitle")}</h3><p>{t("welcome.supportText")}</p></div>
        </div>
        {!validDonationUrl && <p className="welcome-config-notice">{t("welcome.notConfigured")}</p>}
        {error && <p className="image-import-error" role="alert">{error}</p>}
        <label className="welcome-startup"><input type="checkbox" checked={showOnStartup} onChange={(event) => useSettingsStore.getState().setShowWelcomeOnStartup(event.target.checked)} />{t("welcome.showOnStartup")}</label>
        <div className="welcome-actions">
          <button className="welcome-donate" disabled={!validDonationUrl} onClick={() => void donate()}>♥ {t("welcome.donate")}</button>
          <button className="welcome-later" onClick={onClose}>{t("welcome.later")}</button>
        </div>
      </div>
    </section>
  </div>;
}
