import { useState } from "react";
import { createGroup, createImage, createMultiPath } from "../../scene/factory";
import {
  DEFAULT_TRACE_OPTIONS,
  importErrorMessage,
  importImageAsDataUri,
  pickImagePath,
  traceImage,
  type TraceOptions,
} from "../../io/imageImport";
import { parseTracedSvg } from "../../scene/pathData";
import type { ElementId } from "../../scene/types";
import { AddElementsCommand } from "../../store/commands/AddElementsCommand";
import { useHistoryStore } from "../../store/historyStore";
import { useSceneStore } from "../../store/sceneStore";
import { useSelectionStore } from "../../store/selectionStore";
import { localizedError, t, type MessageKey } from "../../i18n";
import { useI18n } from "../../i18n/useI18n";

type ImportMode = "raster" | "vector";

const MAX_PLACEMENT_DIM = 500;

const TRACE_PRESETS: { label: MessageKey; options: TraceOptions }[] = [
  { label: "image.presetLogo", options: { ...DEFAULT_TRACE_OPTIONS, colorPrecision: 5, filterSpeckle: 8, layerDifference: 20, pathPrecision: 2 } },
  { label: "image.presetSilhouette", options: { ...DEFAULT_TRACE_OPTIONS, colorMode: "binary", hierarchical: "cutout", filterSpeckle: 10, colorPrecision: 2 } },
  { label: "image.presetDetailed", options: { ...DEFAULT_TRACE_OPTIONS, filterSpeckle: 2, colorPrecision: 7, layerDifference: 8, pathPrecision: 3 } },
  { label: "image.presetStencil", options: { ...DEFAULT_TRACE_OPTIONS, colorMode: "binary", hierarchical: "cutout", mode: "polygon", filterSpeckle: 12, cornerThreshold: 45 } },
];

/**
 * Scale factor to shrink an imported image/trace to a reasonable on-canvas size. Capped by both
 * a fixed max dimension AND a fraction of the target artboard's own size — a small custom
 * artboard should never end up with an imported image towering far outside its bounds just
 * because MAX_PLACEMENT_DIM alone happened to be smaller than the image but bigger than the
 * artboard.
 */
function fitScale(maxDim: number, artboard: { width: number; height: number }): number {
  const cap = Math.min(MAX_PLACEMENT_DIM, artboard.width * 0.8, artboard.height * 0.8);
  return maxDim > cap ? cap / maxDim : 1;
}

export function ImageImportDialog({ onClose }: { onClose: () => void }) {
  const { t: tr } = useI18n();
  const [path, setPath] = useState<string | null>(null);
  const [mode, setMode] = useState<ImportMode>("raster");
  const [options, setOptions] = useState<TraceOptions>(DEFAULT_TRACE_OPTIONS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = (p: Partial<TraceOptions>) => setOptions((prev) => ({ ...prev, ...p }));

  const handlePick = async () => {
    setError(null);
    try {
      const picked = await pickImagePath();
      if (picked) setPath(picked);
    } catch (err) {
      setError(importErrorMessage(err, tr("error.filePicker")));
    }
  };

  const placement = () => {
    const artboard = useSceneStore.getState().scene.artboards[0];
    return artboard ?? { x: 0, y: 0, width: 800, height: 600 };
  };

  const handleImport = async () => {
    if (!path) return;
    setBusy(true);
    setError(null);
    try {
      const artboard = placement();
      if (mode === "raster") {
        const { dataUri, width, height } = await importImageAsDataUri(path);
        const scale = fitScale(Math.max(width, height), artboard);
        const w = width * scale;
        const h = height * scale;
        const x = artboard.x + (artboard.width - w) / 2;
        const y = artboard.y + (artboard.height - h) / 2;
        const node = createImage(x, y, dataUri, w, h);
        useHistoryStore.getState().execute(new AddElementsCommand([node], undefined, t("command.importImage")));
        useSelectionStore.getState().select([node.id]);
      } else {
        const svg = await traceImage(path, options);
        const shapes = parseTracedSvg(svg);
        if (shapes.length === 0) {
          setError(tr("error.traceEmpty"));
          setBusy(false);
          return;
        }
        const pathNodes = shapes.map((shape) => {
          const node = createMultiPath(shape.x, shape.y, shape.subpaths);
          node.style.fill = shape.fill;
          node.style.stroke = "none";
          if (options.hierarchical === "cutout") node.style.fillRule = "evenodd";
          return node;
        });
        const group = createGroup(pathNodes);
        const maxDim = Math.max(group.bounds.width, group.bounds.height) || 1;
        const scale = fitScale(maxDim, artboard);
        group.transform.scaleX = scale;
        group.transform.scaleY = scale;
        group.transform.x = artboard.x + (artboard.width - group.bounds.width * scale) / 2;
        group.transform.y = artboard.y + (artboard.height - group.bounds.height * scale) / 2;

        const childOnlyIds = new Set<ElementId>(pathNodes.map((n) => n.id));
        useHistoryStore
          .getState()
          .execute(new AddElementsCommand([...pathNodes, group], undefined, t("command.traceImage"), childOnlyIds));
        useSelectionStore.getState().select([group.id]);
      }
      onClose();
    } catch (err) {
      setError(localizedError(err, "error.imageImport"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog image-import-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>{tr("image.title")}</h3>

        {!path ? (
          <button onClick={() => void handlePick()}>{tr("image.choose")}</button>
        ) : (
          <>
            <p className="image-import-path" title={path}>
              {path}
            </p>

            <div className="prop-row-controls">
              <button
                className={mode === "raster" ? "primary" : ""}
                onClick={() => setMode("raster")}
                disabled={busy}
              >
                {tr("image.raster")}
              </button>
              <button
                className={mode === "vector" ? "primary" : ""}
                onClick={() => setMode("vector")}
                disabled={busy}
              >
                {tr("image.vector")}
              </button>
            </div>

            {mode === "raster" && (
              <p className="image-import-hint">
                {tr("image.rasterHint")}
              </p>
            )}

            {mode === "vector" && (
              <div className="trace-options">
                <div className="trace-presets">
                  <span>{tr("image.quickSettings")}</span>
                  <div className="prop-row-controls">
                    {TRACE_PRESETS.map((preset) => (
                      <button key={preset.label} type="button" disabled={busy} onClick={() => setOptions({ ...preset.options })}>
                        {tr(preset.label)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="trace-row">
                  <label>{tr("image.colorMode")}</label>
                  <select
                    value={options.colorMode}
                    onChange={(e) => patch({ colorMode: e.target.value as TraceOptions["colorMode"] })}
                  >
                    <option value="color">{tr("image.color")}</option><option value="binary">{tr("image.blackWhite")}</option>
                  </select>
                </div>
                <div className="trace-row">
                  <label>{tr("image.traceStyle")}</label>
                  <select value={options.mode} onChange={(e) => patch({ mode: e.target.value as TraceOptions["mode"] })}>
                    <option value="spline">{tr("image.curves")}</option><option value="polygon">{tr("image.polygons")}</option><option value="none">{tr("image.pixels")}</option>
                  </select>
                </div>
                <div className="trace-row">
                  <label>{tr("image.layers")}</label>
                  <select
                    value={options.hierarchical}
                    onChange={(e) => patch({ hierarchical: e.target.value as TraceOptions["hierarchical"] })}
                  >
                    <option value="stacked">{tr("image.stacked")}</option><option value="cutout">{tr("image.cutout")}</option>
                  </select>
                </div>
                <div className="trace-row">
                  <label>{tr("image.colorPrecision")}</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={options.colorPrecision}
                    onChange={(e) => patch({ colorPrecision: Number(e.target.value) })}
                  />
                </div>
                <div className="trace-row">
                  <label>{tr("image.noise")}</label>
                  <input
                    type="number"
                    min={0}
                    value={options.filterSpeckle}
                    onChange={(e) => patch({ filterSpeckle: Number(e.target.value) })}
                  />
                </div>
                <div className="trace-row">
                  <label>{tr("image.corner")}</label>
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={options.cornerThreshold}
                    onChange={(e) => patch({ cornerThreshold: Number(e.target.value) })}
                  />
                </div>

                <details>
                  <summary>{tr("image.advanced")}</summary>
                  <div className="trace-row">
                    <label>{tr("image.layerDifference")}</label>
                    <input
                      type="number"
                      min={0}
                      value={options.layerDifference}
                      onChange={(e) => patch({ layerDifference: Number(e.target.value) })}
                    />
                  </div>
                  <div className="trace-row">
                    <label>{tr("image.length")}</label>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={options.lengthThreshold}
                      onChange={(e) => patch({ lengthThreshold: Number(e.target.value) })}
                    />
                  </div>
                  <div className="trace-row">
                    <label>{tr("image.iterations")}</label>
                    <input
                      type="number"
                      min={1}
                      value={options.maxIterations}
                      onChange={(e) => patch({ maxIterations: Number(e.target.value) })}
                    />
                  </div>
                  <div className="trace-row">
                    <label>{tr("image.splice")}</label>
                    <input
                      type="number"
                      min={0}
                      value={options.spliceThreshold}
                      onChange={(e) => patch({ spliceThreshold: Number(e.target.value) })}
                    />
                  </div>
                  <div className="trace-row">
                    <label>{tr("image.pathPrecision")}</label>
                    <input
                      type="number"
                      min={0}
                      max={8}
                      value={options.pathPrecision ?? 2}
                      onChange={(e) => patch({ pathPrecision: Number(e.target.value) })}
                    />
                  </div>
                </details>
              </div>
            )}
          </>
        )}

        {error && <p className="image-import-error">{error}</p>}

        <div className="dialog-actions">
          <button onClick={onClose} disabled={busy}>
            {tr("common.cancel")}
          </button>
          {path && (
            <button className="primary" onClick={() => void handleImport()} disabled={busy}>
              {busy ? tr("image.importing") : tr("common.import")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
