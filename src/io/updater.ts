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
export async function installUpdateAndRelaunch(update: Update): Promise<void> {
  await update.downloadAndInstall();
  await relaunch();
}
