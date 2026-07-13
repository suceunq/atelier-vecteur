import { useState } from "react";
import { installUpdateAndRelaunch } from "../io/updater";
import type { Update } from "@tauri-apps/plugin-updater";

export function UpdateDialog({ update, onClose }: { update: Update; onClose: () => void }) {
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ percent: 0, bytesPerSecond: 0, secondsRemaining: null as number | null });

  const handleInstall = async () => {
    setInstalling(true);
    setError(null);
    try {
      await installUpdateAndRelaunch(update, setProgress);
      // The app relaunches on success — nothing left to update here.
    } catch (err) {
      setInstalling(false);
      setError(err instanceof Error ? err.message : "Échec de l'installation de la mise à jour.");
    }
  };

  return (
    <div className="dialog-overlay" onClick={installing ? undefined : onClose}>
      <div className="dialog update-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Mise à jour disponible</h3>
        <p className="image-import-hint">
          Version {update.version} (vous avez la {update.currentVersion})
        </p>
        {update.body && <pre className="update-notes">{update.body}</pre>}
        {installing && <div><p>Téléchargement en cours…</p><div className="update-download-track"><span style={{ width: `${progress.percent}%` }} /></div><p className="image-import-hint">{progress.percent}% · {progress.bytesPerSecond ? `${(progress.bytesPerSecond / 1048576).toFixed(1)} Mo/s` : "calcul…"} · Temps restant estimé : {progress.secondsRemaining ?? "…"} s</p></div>}
        {error && <p className="image-import-error">{error}</p>}
        <div className="dialog-actions">
          <button onClick={onClose} disabled={installing}>
            Plus tard
          </button>
          <button className="primary" onClick={() => void handleInstall()} disabled={installing}>
            {installing ? "Installation…" : "Installer et redémarrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
