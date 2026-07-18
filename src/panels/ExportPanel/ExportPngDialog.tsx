import { useState } from "react";
import { exportPng } from "../../io/pngExport";
import { useSceneStore } from "../../store/sceneStore";
import { localizedError } from "../../i18n";
import { useI18n } from "../../i18n/useI18n";

export function ExportPngDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const artboard = useSceneStore((s) => s.scene.artboards[0]);
  const [width, setWidth] = useState(artboard?.width ?? 800);
  const [height, setHeight] = useState(artboard?.height ?? 600);

  const handleExport = async () => {
    try {
      await exportPng(width, height);
      onClose();
    } catch (err) {
      window.alert(localizedError(err, "error.exportPng"));
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>{t("png.title")}</h3>
        <label>
          {t("png.width")}
          <input type="number" min={1} value={width} onChange={(e) => setWidth(Number(e.target.value))} />
        </label>
        <label>
          {t("png.height")}
          <input type="number" min={1} value={height} onChange={(e) => setHeight(Number(e.target.value))} />
        </label>
        <div className="dialog-actions">
          <button onClick={onClose}>{t("common.cancel")}</button>
          <button className="primary" onClick={() => void handleExport()}>
            {t("common.export")}
          </button>
        </div>
      </div>
    </div>
  );
}
