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

type ImportMode = "raster" | "vector";

const MAX_PLACEMENT_DIM = 500;

const TRACE_PRESETS: Record<string, TraceOptions> = {
  "Logo couleur": { ...DEFAULT_TRACE_OPTIONS, colorPrecision: 5, filterSpeckle: 8, layerDifference: 20, pathPrecision: 2 },
  Silhouette: { ...DEFAULT_TRACE_OPTIONS, colorMode: "binary", hierarchical: "cutout", filterSpeckle: 10, colorPrecision: 2 },
  "Dessin détaillé": { ...DEFAULT_TRACE_OPTIONS, filterSpeckle: 2, colorPrecision: 7, layerDifference: 8, pathPrecision: 3 },
  "Découpe / pochoir": { ...DEFAULT_TRACE_OPTIONS, colorMode: "binary", hierarchical: "cutout", mode: "polygon", filterSpeckle: 12, cornerThreshold: 45 },
};

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
      setError(importErrorMessage(err, "Impossible d'ouvrir le sélecteur de fichier."));
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
        useHistoryStore.getState().execute(new AddElementsCommand([node], undefined, "Importer une image"));
        useSelectionStore.getState().select([node.id]);
      } else {
        const svg = await traceImage(path, options);
        const shapes = parseTracedSvg(svg);
        if (shapes.length === 0) {
          setError("Le tracé n'a produit aucune forme exploitable.");
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
          .execute(new AddElementsCommand([...pathNodes, group], undefined, "Tracer l'image", childOnlyIds));
        useSelectionStore.getState().select([group.id]);
      }
      onClose();
    } catch (err) {
      setError(importErrorMessage(err, "Échec de l'import de l'image."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog image-import-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Importer une image</h3>

        {!path ? (
          <button onClick={() => void handlePick()}>Choisir un fichier…</button>
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
                Image (SVG)
              </button>
              <button
                className={mode === "vector" ? "primary" : ""}
                onClick={() => setMode("vector")}
                disabled={busy}
              >
                Vectoriel (tracé)
              </button>
            </div>

            {mode === "raster" && (
              <p className="image-import-hint">
                L'image est intégrée telle quelle dans le SVG (encodée en base64).
              </p>
            )}

            {mode === "vector" && (
              <div className="trace-options">
                <div className="trace-presets">
                  <span>Réglages rapides</span>
                  <div className="prop-row-controls">
                    {Object.entries(TRACE_PRESETS).map(([name, preset]) => (
                      <button key={name} type="button" disabled={busy} onClick={() => setOptions({ ...preset })}>
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="trace-row">
                  <label>Mode couleur</label>
                  <select
                    value={options.colorMode}
                    onChange={(e) => patch({ colorMode: e.target.value as TraceOptions["colorMode"] })}
                  >
                    <option value="color">Couleur</option>
                    <option value="binary">Noir et blanc</option>
                  </select>
                </div>
                <div className="trace-row">
                  <label>Style de tracé</label>
                  <select value={options.mode} onChange={(e) => patch({ mode: e.target.value as TraceOptions["mode"] })}>
                    <option value="spline">Courbes</option>
                    <option value="polygon">Polygones</option>
                    <option value="none">Pixels (brut)</option>
                  </select>
                </div>
                <div className="trace-row">
                  <label>Calques</label>
                  <select
                    value={options.hierarchical}
                    onChange={(e) => patch({ hierarchical: e.target.value as TraceOptions["hierarchical"] })}
                  >
                    <option value="stacked">Empilés</option>
                    <option value="cutout">Découpés</option>
                  </select>
                </div>
                <div className="trace-row">
                  <label>Précision des couleurs</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={options.colorPrecision}
                    onChange={(e) => patch({ colorPrecision: Number(e.target.value) })}
                  />
                </div>
                <div className="trace-row">
                  <label>Filtrer le bruit (px)</label>
                  <input
                    type="number"
                    min={0}
                    value={options.filterSpeckle}
                    onChange={(e) => patch({ filterSpeckle: Number(e.target.value) })}
                  />
                </div>
                <div className="trace-row">
                  <label>Seuil des angles</label>
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={options.cornerThreshold}
                    onChange={(e) => patch({ cornerThreshold: Number(e.target.value) })}
                  />
                </div>

                <details>
                  <summary>Options avancées</summary>
                  <div className="trace-row">
                    <label>Différence entre calques</label>
                    <input
                      type="number"
                      min={0}
                      value={options.layerDifference}
                      onChange={(e) => patch({ layerDifference: Number(e.target.value) })}
                    />
                  </div>
                  <div className="trace-row">
                    <label>Seuil de longueur</label>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={options.lengthThreshold}
                      onChange={(e) => patch({ lengthThreshold: Number(e.target.value) })}
                    />
                  </div>
                  <div className="trace-row">
                    <label>Itérations max</label>
                    <input
                      type="number"
                      min={1}
                      value={options.maxIterations}
                      onChange={(e) => patch({ maxIterations: Number(e.target.value) })}
                    />
                  </div>
                  <div className="trace-row">
                    <label>Seuil de jonction</label>
                    <input
                      type="number"
                      min={0}
                      value={options.spliceThreshold}
                      onChange={(e) => patch({ spliceThreshold: Number(e.target.value) })}
                    />
                  </div>
                  <div className="trace-row">
                    <label>Précision du tracé (décimales)</label>
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
            Annuler
          </button>
          {path && (
            <button className="primary" onClick={() => void handleImport()} disabled={busy}>
              {busy ? "Import…" : "Importer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
