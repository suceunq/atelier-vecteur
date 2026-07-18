import { useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { installUpdateAndRelaunch } from "../io/updater";
import type { Update } from "@tauri-apps/plugin-updater";
import { localizedError, t as translate } from "../i18n";
import { useI18n } from "../i18n/useI18n";

const RELEASES_URL = "https://github.com/suceunq/atelier-vecteur/releases/latest";

export function UpdateDialog({ update, onClose }: { update: Update; onClose: () => void }) {
  const { t } = useI18n();
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, bytesPerSecond: 0, secondsRemaining: null as number | null });

  const handleInstall = async () => {
    setInstalling(true);
    setError(null);
    setSignatureError(false);
    try {
      await installUpdateAndRelaunch(update, setProgress);
      // The app relaunches on success — nothing left to update here.
    } catch (err) {
      setInstalling(false);
      const message = localizedError(err, "error.updateInstall");
      setError(message);
      setSignatureError(message === translate("error.updateSignature"));
    }
  };

  return (
    <div className="dialog-overlay" onClick={installing ? undefined : onClose}>
      <div className="dialog update-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>{t("update.title")}</h3>
        <p className="image-import-hint">
          {t("update.version", { version: update.version, current: update.currentVersion })}
        </p>
        {update.body && <pre className="update-notes">{update.body}</pre>}
        {installing && <div><p>{t("update.downloading")}</p><div className="update-download-track"><span style={{ width: `${progress.percent}%` }} /></div><p className="image-import-hint">{progress.percent}% · {progress.bytesPerSecond ? t("update.speed", { speed: (progress.bytesPerSecond / 1048576).toFixed(1) }) : t("update.calculating")} · {t("update.remaining", { seconds: progress.secondsRemaining ?? "…" })}</p></div>}
        {error && <p className="image-import-error">{error}</p>}
        <div className="dialog-actions">
          <button onClick={onClose} disabled={installing}>
            {t("update.later")}
          </button>
          {signatureError ? (
            <button className="primary" onClick={() => void openUrl(RELEASES_URL)}>
              {t("update.openReleasePage")}
            </button>
          ) : (
            <button className="primary" onClick={() => void handleInstall()} disabled={installing}>
              {installing ? t("update.installing") : t("update.install")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
