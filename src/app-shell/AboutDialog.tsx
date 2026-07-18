import { getVersion } from "@tauri-apps/api/app";
import { useEffect, useState } from "react";
import { useI18n } from "../i18n/useI18n";

export function AboutDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [version, setVersion] = useState("…");

  useEffect(() => {
    getVersion().then(setVersion).catch(() => setVersion(t("common.unknown")));
  }, [t]);

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog about-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="about-header">
          <div>
            <h3>{t("about.title")}</h3>
            <p>{t("about.version", { version })}</p>
          </div>
          <button className="about-close" onClick={onClose} aria-label={t("common.close")}>×</button>
        </div>

        <section>
          <h4>Atelier Vecteur</h4>
          <p>{t("about.description")}</p>
        </section>

        <section>
          <h4>{t("about.credits")}</h4><p>{t("about.design")}</p><p>{t("about.builtWith")}</p><p>{t("about.engines")}</p>
        </section>

        <footer>{t("about.footer")}</footer>

        <div className="dialog-actions">
          <button onClick={onClose}>{t("common.close")}</button>
        </div>
      </div>
    </div>
  );
}
