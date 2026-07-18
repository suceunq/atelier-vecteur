import { useEffect, useState } from "react";
import type { Update } from "@tauri-apps/plugin-updater";
import { exportSvg } from "../io/svgExport";
import { openProject, saveProject, saveProjectAs } from "../io/projectFile";
import { checkForUpdates } from "../io/updater";
import { ExportPngDialog } from "../panels/ExportPanel/ExportPngDialog";
import { ImageImportDialog } from "../panels/ImagePanel/ImageImportDialog";
import { createEmptyScene } from "../scene/factory";
import { useHistoryStore } from "../store/historyStore";
import { useSceneStore } from "../store/sceneStore";
import { useSelectionStore } from "../store/selectionStore";
import { useSettingsStore } from "../store/settingsStore";
import { useViewportStore } from "../store/viewportStore";
import { useDocumentStore } from "../store/documentStore";
import { UpdateDialog } from "./UpdateDialog";
import { AboutDialog } from "./AboutDialog";
import { FeedbackDialog } from "./FeedbackDialog";
import { SettingsDialog } from "./SettingsDialog";
import { WelcomeDialog } from "./WelcomeDialog";
import { localizedError } from "../i18n";
import { useI18n } from "../i18n/useI18n";

// Menus are native <details>/<summary> elements, which don't close themselves when an
// item inside is clicked. Closing the nearest ancestor <details> on any click inside the
// dropdown (after the item's own onClick has already run, via event bubbling) mimics the
// usual "menu closes after you pick something" behavior.
function closeMenu(e: React.MouseEvent<HTMLDivElement>) {
  e.currentTarget.closest("details")?.removeAttribute("open");
}

export function MenuBar() {
  const { t } = useI18n();
  const [showPngDialog, setShowPngDialog] = useState(false);
  const [showImageImportDialog, setShowImageImportDialog] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<Update | null>(null);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(() => useSettingsStore.getState().showWelcomeOnStartup);
  const theme = useSettingsStore((s) => s.theme);
  const snapEnabled = useViewportStore((s) => s.snapEnabled);

  // Silent check on launch: an update found here opens the same dialog as the manual menu
  // action, but a failure (endpoint unreachable, offline, etc.) stays silent — the user didn't
  // ask for anything, so there's nothing to report back beyond "no update dialog appeared".
  useEffect(() => {
    checkForUpdates()
      .then((update) => {
        if (update) setPendingUpdate(update);
      })
      .catch(() => {
        // ignored — see comment above
      });
  }, []);

  const confirmDiscard = () =>
    !useDocumentStore.getState().dirty || window.confirm(t("dialog.unsaved"));

  const handleNew = () => {
    if (!confirmDiscard()) return;
    useSceneStore.getState().replaceScene(createEmptyScene());
    useSelectionStore.getState().clear();
    useHistoryStore.getState().clear();
    useDocumentStore.getState().markSaved(null);
  };

  const handleOpen = async () => {
    if (!confirmDiscard()) return;
    try {
      await openProject();
    } catch (err) {
      window.alert(localizedError(err, "error.openProject"));
    }
  };

  const handleSave = async () => {
    try {
      await saveProject();
    } catch (err) {
      window.alert(localizedError(err, "error.saveProject"));
    }
  };

  const handleExportSvg = async () => {
    try {
      await exportSvg();
    } catch (err) {
      window.alert(localizedError(err, "error.exportSvg"));
    }
  };

  const handleCheckForUpdates = async () => {
    try {
      const update = await checkForUpdates();
      if (!update) {
        window.alert(t("update.upToDate"));
        return;
      }
      setPendingUpdate(update);
    } catch (err) {
      window.alert(
        err instanceof Error
          ? `${t("error.updateCheck")} ${err.message}`
          : t("error.updateServer")
      );
    }
  };

  return (
    <div className="menu-bar">
      <span className="app-title">Atelier Vecteur</span>

      <details className="menu" name="app-menu">
        <summary>{t("menu.file")}</summary>
        <div className="menu-dropdown" onClick={closeMenu}>
          <button className="menu-item" onClick={handleNew}>
            {t("menu.new")}
          </button>
          <button className="menu-item" onClick={() => void handleOpen()}>
            {t("menu.open")}
          </button>
          <button className="menu-item" onClick={() => void handleSave()}>
            {t("menu.save")}
          </button>
          <button className="menu-item" onClick={() => void saveProjectAs()}>
            {t("menu.saveAs")}
          </button>
          <hr />
          <button className="menu-item" onClick={() => setShowImageImportDialog(true)}>
            {t("menu.importImage")}
          </button>
          <hr />
          <button className="menu-item" onClick={() => void handleExportSvg()}>
            {t("menu.exportSvg")}
          </button>
          <button className="menu-item" onClick={() => setShowPngDialog(true)}>
            {t("menu.exportPng")}
          </button>
        </div>
      </details>

      <details className="menu" name="app-menu">
        <summary>{t("menu.edit")}</summary>
        <div className="menu-dropdown" onClick={closeMenu}>
          <button className="menu-item" onClick={() => useHistoryStore.getState().undo()}>
            {t("menu.undo")}
          </button>
          <button className="menu-item" onClick={() => useHistoryStore.getState().redo()}>
            {t("menu.redo")}
          </button>
        </div>
      </details>

      <details className="menu" name="app-menu">
        <summary>{t("menu.view")}</summary>
        <div className="menu-dropdown" onClick={closeMenu}>
          <button className="menu-item" onClick={() => useViewportStore.getState().toggleGrid()}>
            {t("menu.grid")}
          </button>
          <button
            className={`menu-item${snapEnabled ? " menu-item-checked" : ""}`}
            onClick={() => useViewportStore.getState().toggleSnap()}
          >
            {t("menu.snap")}
          </button>
          <button className="menu-item" onClick={() => useViewportStore.getState().setZoom(1)}>
            {t("menu.resetZoom")}
          </button>
          <hr />
          <button
            className={`menu-item${theme === "dark" ? " menu-item-checked" : ""}`}
            onClick={() => useSettingsStore.getState().toggleTheme()}
          >
            {t("menu.darkMode")}
          </button>
          <button className="menu-item" onClick={() => setShowSettingsDialog(true)}>{t("menu.settings")}</button>
        </div>
      </details>

      <details className="menu" name="app-menu">
        <summary>{t("menu.help")}</summary>
        <div className="menu-dropdown" onClick={closeMenu}>
          <button className="menu-item" onClick={() => void handleCheckForUpdates()}>
            {t("menu.checkUpdates")}
          </button>
          <button className="menu-item" onClick={() => setShowWelcomeDialog(true)}>
            {t("menu.welcome")}
          </button>
          <button className="menu-item" onClick={() => setShowFeedbackDialog(true)}>
            ✉ {t("menu.feedback")}
          </button>
          <hr />
          <button className="menu-item" onClick={() => setShowAboutDialog(true)}>
            {t("menu.about")}
          </button>
        </div>
      </details>

      {showPngDialog && <ExportPngDialog onClose={() => setShowPngDialog(false)} />}
      {showImageImportDialog && <ImageImportDialog onClose={() => setShowImageImportDialog(false)} />}
      {pendingUpdate && !showWelcomeDialog && <UpdateDialog update={pendingUpdate} onClose={() => setPendingUpdate(null)} />}
      {showAboutDialog && <AboutDialog onClose={() => setShowAboutDialog(false)} />}
      {showFeedbackDialog && <FeedbackDialog onClose={() => setShowFeedbackDialog(false)} />}
      {showSettingsDialog && <SettingsDialog onClose={() => setShowSettingsDialog(false)} />}
      {showWelcomeDialog && <WelcomeDialog onClose={() => setShowWelcomeDialog(false)} />}
    </div>
  );
}
