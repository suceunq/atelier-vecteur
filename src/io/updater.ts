import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";

/**
 * Checks the configured update endpoint (see `plugins.updater.endpoints` in `tauri.conf.json`) —
 * that endpoint is a placeholder until a real hosting location (e.g. GitHub Releases) is set up,
 * so this will surface a clear "not reachable" message rather than a raw network error until then.
 * Returns the pending Update (caller decides whether to actually install it), or null if already current.
 */
export async function checkForUpdates(): Promise<Update | null> {
  return check();
}

/** Downloads, installs, and relaunches the app onto the given update — call only after the user has confirmed. */
export interface UpdateProgress { percent: number; bytesPerSecond: number; secondsRemaining: number | null }

export async function installUpdateAndRelaunch(update: Update, onProgress: (progress: UpdateProgress) => void): Promise<void> {
  let downloaded = 0;
  let total = 0;
  let startedAt = Date.now();
  await update.downloadAndInstall((event) => {
    if (event.event === "Started") {
      total = event.data.contentLength ?? 0;
      downloaded = 0;
      startedAt = Date.now();
    } else if (event.event === "Progress") {
      downloaded += event.data.chunkLength;
      const elapsed = Math.max(0.1, (Date.now() - startedAt) / 1000);
      const bytesPerSecond = downloaded / elapsed;
      const percent = total > 0 ? Math.min(100, Math.round((downloaded / total) * 100)) : 0;
      const secondsRemaining = total > 0 && bytesPerSecond > 0 ? Math.max(0, Math.round((total - downloaded) / bytesPerSecond)) : null;
      onProgress({ percent, bytesPerSecond, secondsRemaining });
    }
  });
  await relaunch();
}
