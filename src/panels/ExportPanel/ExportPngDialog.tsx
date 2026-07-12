import { useState } from "react";
import { exportPng } from "../../io/pngExport";
import { useSceneStore } from "../../store/sceneStore";

export function ExportPngDialog({ onClose }: { onClose: () => void }) {
  const artboard = useSceneStore((s) => s.scene.artboards[0]);
  const [width, setWidth] = useState(artboard?.width ?? 800);
  const [height, setHeight] = useState(artboard?.height ?? 600);

  const handleExport = async () => {
    try {
      await exportPng(width, height);
      onClose();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Impossible d'exporter le PNG.");
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Exporter en PNG</h3>
        <label>
          Largeur (px)
          <input type="number" min={1} value={width} onChange={(e) => setWidth(Number(e.target.value))} />
        </label>
        <label>
          Hauteur (px)
          <input type="number" min={1} value={height} onChange={(e) => setHeight(Number(e.target.value))} />
        </label>
        <div className="dialog-actions">
          <button onClick={onClose}>Annuler</button>
          <button className="primary" onClick={() => void handleExport()}>
            Exporter
          </button>
        </div>
      </div>
    </div>
  );
}
