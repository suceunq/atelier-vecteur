import { GenericCommand } from "../../store/commands/GenericCommand";
import { createLayer } from "../../scene/factory";
import { useHistoryStore } from "../../store/historyStore";
import { useSceneStore } from "../../store/sceneStore";
import { LayerRow } from "./LayerRow";

export function LayersPanel() {
  const layers = useSceneStore((s) => s.scene.layers);

  const addLayer = () => {
    const layer = createLayer(`Calque ${layers.length + 1}`);
    useHistoryStore.getState().execute(
      new GenericCommand(
        "Ajouter un calque",
        () => useSceneStore.setState((state) => ({ scene: { ...state.scene, layers: [...state.scene.layers, layer] } })),
        () =>
          useSceneStore.setState((state) => ({
            scene: { ...state.scene, layers: state.scene.layers.filter((l) => l.id !== layer.id) },
          }))
      )
    );
  };

  // reversed for display: topmost (last in array = rendered on top) shows first
  const displayLayers = [...layers].reverse();

  return (
    <div className="panel layers-panel">
      <div className="panel-header">
        <h3>Calques</h3>
        <button className="icon-button" title="Ajouter un calque" onClick={addLayer}>
          +
        </button>
      </div>
      <div className="layers-list">
        {displayLayers.map((layer) => (
          <LayerRow
            key={layer.id}
            layer={layer}
            isTop={layers[layers.length - 1]?.id === layer.id}
            isBottom={layers[0]?.id === layer.id}
          />
        ))}
      </div>
    </div>
  );
}
