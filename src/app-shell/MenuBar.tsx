import { useState } from "react";
import { exportSvg } from "../io/svgExport";
import { openProject, saveProjectAs } from "../io/projectFile";
import { ExportPngDialog } from "../panels/ExportPanel/ExportPngDialog";
import { createEmptyScene } from "../scene/factory";
import { useHistoryStore } from "../store/historyStore";
import { useSceneStore } from "../store/sceneStore";
import { useSelectionStore } from "../store/selectionStore";
import { useViewportStore } from "../store/viewportStore";

export function MenuBar() {
  const [showPngDialog, setShowPngDialog] = useState(false);

  const handleNew = () => {
    useSceneStore.getState().replaceScene(createEmptyScene());
    useSelectionStore.getState().clear();
    useHistoryStore.getState().clear();
  };

  return (
    <div className="menu-bar">
      <span className="app-title">SVG Atelier</span>

      <details className="menu">
        <summary>Fichier</summary>
        <div className="menu-dropdown">
          <button className="menu-item" onClick={handleNew}>
            Nouveau
          </button>
          <button className="menu-item" onClick={() => void openProject()}>
            Ouvrir…
          </button>
          <button className="menu-item" onClick={() => void saveProjectAs()}>
            Enregistrer sous…
          </button>
          <hr />
          <button className="menu-item" onClick={() => void exportSvg()}>
            Exporter en SVG…
          </button>
          <button className="menu-item" onClick={() => setShowPngDialog(true)}>
            Exporter en PNG…
          </button>
        </div>
      </details>

      <details className="menu">
        <summary>Édition</summary>
        <div className="menu-dropdown">
          <button className="menu-item" onClick={() => useHistoryStore.getState().undo()}>
            Annuler (Ctrl+Z)
          </button>
          <button className="menu-item" onClick={() => useHistoryStore.getState().redo()}>
            Rétablir (Ctrl+Y)
          </button>
        </div>
      </details>

      <details className="menu">
        <summary>Affichage</summary>
        <div className="menu-dropdown">
          <button className="menu-item" onClick={() => useViewportStore.getState().toggleGrid()}>
            Basculer la grille
          </button>
          <button className="menu-item" onClick={() => useViewportStore.getState().setZoom(1)}>
            Réinitialiser le zoom (100%)
          </button>
        </div>
      </details>

      {showPngDialog && <ExportPngDialog onClose={() => setShowPngDialog(false)} />}
    </div>
  );
}
