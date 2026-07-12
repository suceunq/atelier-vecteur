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

// Menus are native <details>/<summary> elements, which don't close themselves when an
// item inside is clicked. Closing the nearest ancestor <details> on any click inside the
// dropdown (after the item's own onClick has already run, via event bubbling) mimics the
// usual "menu closes after you pick something" behavior.
function closeMenu(e: React.MouseEvent<HTMLDivElement>) {
  e.currentTarget.closest("details")?.removeAttribute("open");
}

export function MenuBar() {
  const [showPngDialog, setShowPngDialog] = useState(false);
  const [showImageImportDialog, setShowImageImportDialog] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<Update | null>(null);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
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
    !useDocumentStore.getState().dirty || window.confirm("Les modifications non enregistrées seront perdues. Continuer ?");

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
      window.alert(err instanceof Error ? err.message : "Impossible d'ouvrir ce fichier de projet.");
    }
  };

  const handleSave = async () => {
    try {
      await saveProject();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Impossible d'enregistrer le projet.");
    }
  };

  const handleExportSvg = async () => {
    try {
      await exportSvg();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Impossible d'exporter le SVG.");
    }
  };

  const handleCheckForUpdates = async () => {
    try {
      const update = await checkForUpdates();
      if (!update) {
        window.alert("Vous utilisez déjà la dernière version.");
        return;
      }
      setPendingUpdate(update);
    } catch (err) {
      window.alert(
        err instanceof Error
          ? `Vérification des mises à jour impossible : ${err.message}`
          : "Vérification des mises à jour impossible (serveur de mise à jour non configuré ou injoignable)."
      );
    }
  };

  return (
    <div className="menu-bar">
      <span className="app-title">Atelier Vecteur</span>

      <details className="menu" name="app-menu">
        <summary>Fichier</summary>
        <div className="menu-dropdown" onClick={closeMenu}>
          <button className="menu-item" onClick={handleNew}>
            Nouveau
          </button>
          <button className="menu-item" onClick={() => void handleOpen()}>
            Ouvrir…
          </button>
          <button className="menu-item" onClick={() => void handleSave()}>
            Enregistrer (Ctrl+S)
          </button>
          <button className="menu-item" onClick={() => void saveProjectAs()}>
            Enregistrer sous…
          </button>
          <hr />
          <button className="menu-item" onClick={() => setShowImageImportDialog(true)}>
            Importer une image…
          </button>
          <hr />
          <button className="menu-item" onClick={() => void handleExportSvg()}>
            Exporter en SVG…
          </button>
          <button className="menu-item" onClick={() => setShowPngDialog(true)}>
            Exporter en PNG…
          </button>
        </div>
      </details>

      <details className="menu" name="app-menu">
        <summary>Édition</summary>
        <div className="menu-dropdown" onClick={closeMenu}>
          <button className="menu-item" onClick={() => useHistoryStore.getState().undo()}>
            Annuler (Ctrl+Z)
          </button>
          <button className="menu-item" onClick={() => useHistoryStore.getState().redo()}>
            Rétablir (Ctrl+Y)
          </button>
        </div>
      </details>

      <details className="menu" name="app-menu">
        <summary>Affichage</summary>
        <div className="menu-dropdown" onClick={closeMenu}>
          <button className="menu-item" onClick={() => useViewportStore.getState().toggleGrid()}>
            Basculer la grille
          </button>
          <button
            className={`menu-item${snapEnabled ? " menu-item-checked" : ""}`}
            onClick={() => useViewportStore.getState().toggleSnap()}
          >
            Magnétisme sur la grille
          </button>
          <button className="menu-item" onClick={() => useViewportStore.getState().setZoom(1)}>
            Réinitialiser le zoom (100%)
          </button>
          <hr />
          <button
            className={`menu-item${theme === "dark" ? " menu-item-checked" : ""}`}
            onClick={() => useSettingsStore.getState().toggleTheme()}
          >
            Mode sombre
          </button>
        </div>
      </details>

      <details className="menu" name="app-menu">
        <summary>Aide</summary>
        <div className="menu-dropdown" onClick={closeMenu}>
          <button className="menu-item" onClick={() => void handleCheckForUpdates()}>
            Vérifier les mises à jour…
          </button>
          <hr />
          <button className="menu-item" onClick={() => setShowAboutDialog(true)}>
            À propos d’Atelier Vecteur
          </button>
        </div>
      </details>

      {showPngDialog && <ExportPngDialog onClose={() => setShowPngDialog(false)} />}
      {showImageImportDialog && <ImageImportDialog onClose={() => setShowImageImportDialog(false)} />}
      {pendingUpdate && <UpdateDialog update={pendingUpdate} onClose={() => setPendingUpdate(null)} />}
      {showAboutDialog && <AboutDialog onClose={() => setShowAboutDialog(false)} />}
    </div>
  );
}
