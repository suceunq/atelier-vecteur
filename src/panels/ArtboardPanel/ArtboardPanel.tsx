import { createArtboard } from "../../scene/factory";
import type { Artboard } from "../../scene/types";
import { GenericCommand } from "../../store/commands/GenericCommand";
import { useHistoryStore } from "../../store/historyStore";
import { useSceneStore } from "../../store/sceneStore";

const GAP = 40;

export function ArtboardPanel() {
  const artboards = useSceneStore((s) => s.scene.artboards);

  const addArtboard = () => {
    const last = artboards[artboards.length - 1];
    const x = last ? last.x + last.width + GAP : 0;
    const artboard = createArtboard(`Artboard ${artboards.length + 1}`, x, last?.y ?? 0);
    useHistoryStore.getState().execute(
      new GenericCommand(
        "Ajouter un artboard",
        () => useSceneStore.getState().addArtboard(artboard),
        () => useSceneStore.getState().removeArtboard(artboard.id)
      )
    );
  };

  const removeArtboardAt = (artboard: Artboard) => {
    if (artboards.length <= 1) return;
    useHistoryStore.getState().execute(
      new GenericCommand(
        "Supprimer l'artboard",
        () => useSceneStore.getState().removeArtboard(artboard.id),
        () => useSceneStore.getState().addArtboard(artboard)
      )
    );
  };

  const updateField = (artboard: Artboard, patch: Partial<Artboard>) => {
    const before = { ...artboard };
    useHistoryStore.getState().execute(
      new GenericCommand(
        "Modifier l'artboard",
        () => useSceneStore.getState().updateArtboard(artboard.id, patch),
        () => useSceneStore.getState().updateArtboard(artboard.id, before)
      )
    );
  };

  return (
    <div className="panel artboard-panel">
      <div className="panel-header">
        <h3>Artboards</h3>
        <button className="icon-button" title="Ajouter un artboard" onClick={addArtboard}>
          +
        </button>
      </div>
      <div className="artboard-list">
        {artboards.map((artboard) => (
          <div key={artboard.id} className="artboard-row">
            <input
              className="artboard-name-input"
              value={artboard.name}
              onChange={(e) => updateField(artboard, { name: e.target.value })}
            />
            <input
              type="number"
              min={1}
              value={artboard.width}
              onChange={(e) => updateField(artboard, { width: Number(e.target.value) })}
            />
            <input
              type="number"
              min={1}
              value={artboard.height}
              onChange={(e) => updateField(artboard, { height: Number(e.target.value) })}
            />
            <button
              className="icon-button"
              disabled={artboards.length <= 1}
              title="Supprimer l'artboard"
              onClick={() => removeArtboardAt(artboard)}
            >
              🗑
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
