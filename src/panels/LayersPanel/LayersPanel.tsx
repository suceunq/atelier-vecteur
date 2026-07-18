import { GenericCommand } from "../../store/commands/GenericCommand";
import { createLayer } from "../../scene/factory";
import { useHistoryStore } from "../../store/historyStore";
import { useSceneStore } from "../../store/sceneStore";
import { LayerRow } from "./LayerRow";
import { t } from "../../i18n";
import { useI18n } from "../../i18n/useI18n";

export function LayersPanel() {
  const { t: tr } = useI18n();
  const layers = useSceneStore((s) => s.scene.layers);

  const addLayer = () => {
    const layer = createLayer(t("layer.defaultName", { number: layers.length + 1 }));
    useHistoryStore.getState().execute(
      new GenericCommand(
        t("command.addLayer"),
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
        <h3>{tr("layer.title")}</h3><button className="icon-button" title={tr("layer.add")} onClick={addLayer}>
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
