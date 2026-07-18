import type { Style } from "../../scene/types";
import { useSceneStore } from "../../store/sceneStore";
import { useSelectionStore } from "../../store/selectionStore";
import { FillControl } from "./FillControl";
import { FontControl } from "./FontControl";
import { OpacityControl } from "./OpacityControl";
import { StrokeControl } from "./StrokeControl";
import { commitStyleChange } from "./useStyleCommit";
import { TransformControl } from "./TransformControl";
import { useI18n } from "../../i18n/useI18n";

export function PropertiesPanel() {
  const { t } = useI18n();
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const scene = useSceneStore((s) => s.scene);

  if (selectedIds.length === 0) {
    return (
      <div className="panel properties-panel">
        <h3>{t("panel.properties")}</h3><p className="panel-empty">{t("panel.selectHint")}</p>
      </div>
    );
  }

  const firstNode = scene.elements[selectedIds[0]];
  if (!firstNode) return null;
  const style: Style = firstNode.style;

  const handleChange = (patch: Partial<Style>) => commitStyleChange(selectedIds, patch);

  return (
    <div className="panel properties-panel">
      <h3>{t("panel.properties")}</h3>
      {selectedIds.length === 1 && <TransformControl id={firstNode.id} transform={firstNode.transform} />}
      {selectedIds.length === 1 && firstNode.type === "text" && <FontControl node={firstNode} />}
      <FillControl style={style} onChange={handleChange} />
      <StrokeControl style={style} onChange={handleChange} />
      <OpacityControl style={style} onChange={handleChange} />
    </div>
  );
}
