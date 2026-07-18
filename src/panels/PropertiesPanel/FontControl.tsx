import { useState } from "react";
import { convertTextToPathSubpaths } from "../../io/textToPath";
import { createMultiPath } from "../../scene/factory";
import type { TextNode } from "../../scene/types";
import { ConvertTextToPathCommand } from "../../store/commands/ConvertTextToPathCommand";
import { GenericCommand } from "../../store/commands/GenericCommand";
import { useHistoryStore } from "../../store/historyStore";
import { useSceneStore } from "../../store/sceneStore";
import { useSelectionStore } from "../../store/selectionStore";
import { localizedError, t } from "../../i18n";
import { useI18n } from "../../i18n/useI18n";

const FONT_FAMILIES = [
  "Arial, sans-serif",
  "Georgia, serif",
  "'Courier New', monospace",
  "'Times New Roman', serif",
  "Verdana, sans-serif",
];

function commitFontChange(node: TextNode, patch: Partial<TextNode>) {
  const before: Partial<TextNode> = {};
  for (const key of Object.keys(patch) as (keyof TextNode)[]) {
    (before as Record<string, unknown>)[key] = node[key];
  }
  useHistoryStore.getState().execute(
    new GenericCommand(
      t("command.changeFont"),
      () => useSceneStore.getState().updateElementGeometry(node.id, patch),
      () => useSceneStore.getState().updateElementGeometry(node.id, before)
    )
  );
}

export function FontControl({ node }: { node: TextNode }) {
  const { t: tr } = useI18n();
  const [converting, setConverting] = useState(false);

  const handleConvertToPath = async () => {
    setConverting(true);
    try {
      const subpaths = await convertTextToPathSubpaths(node);
      const pathNode = createMultiPath(0, 0, subpaths);
      pathNode.transform = { ...node.transform };
      pathNode.style = { ...node.style, fill: node.style.fill === "none" ? "#000000" : node.style.fill };

      const layerId = useSceneStore.getState().findLayerOfElement(node.id);
      useHistoryStore
        .getState()
        .execute(new ConvertTextToPathCommand(node, pathNode, layerId ?? undefined));
      useSelectionStore.getState().select([pathNode.id]);
    } catch (err) {
      window.alert(localizedError(err, "error.textToPath"));
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="prop-row">
      <label>{tr("panel.font")}</label>
      <div className="prop-row-controls">
        <select value={node.fontFamily} onChange={(e) => commitFontChange(node, { fontFamily: e.target.value })}>
          {FONT_FAMILIES.map((family) => (
            <option key={family} value={family}>
              {family.split(",")[0].replace(/'/g, "")}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={node.fontSize}
          onChange={(e) => commitFontChange(node, { fontSize: Number(e.target.value) })}
        />
        <select
          value={node.fontWeight}
          onChange={(e) => commitFontChange(node, { fontWeight: Number(e.target.value) })}
        >
          <option value={300}>{tr("panel.lightWeight")}</option><option value={400}>{tr("panel.normalWeight")}</option><option value={700}>{tr("panel.boldWeight")}</option>
        </select>
        <select
          value={node.textAnchor}
          onChange={(e) => commitFontChange(node, { textAnchor: e.target.value as TextNode["textAnchor"] })}
        >
          <option value="start">{tr("panel.left")}</option><option value="middle">{tr("panel.center")}</option><option value="end">{tr("panel.right")}</option>
        </select>
      </div>
      <button disabled={converting} onClick={() => void handleConvertToPath()}>
        {converting ? tr("panel.converting") : tr("panel.convertPath")}
      </button>
    </div>
  );
}
