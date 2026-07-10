import type { TextNode } from "../../scene/types";
import { GenericCommand } from "../../store/commands/GenericCommand";
import { useHistoryStore } from "../../store/historyStore";
import { useSceneStore } from "../../store/sceneStore";

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
      "Modifier la police",
      () => useSceneStore.getState().updateElementGeometry(node.id, patch),
      () => useSceneStore.getState().updateElementGeometry(node.id, before)
    )
  );
}

export function FontControl({ node }: { node: TextNode }) {
  return (
    <div className="prop-row">
      <label>Police</label>
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
          <option value={300}>Léger</option>
          <option value={400}>Normal</option>
          <option value={700}>Gras</option>
        </select>
        <select
          value={node.textAnchor}
          onChange={(e) => commitFontChange(node, { textAnchor: e.target.value as TextNode["textAnchor"] })}
        >
          <option value="start">Gauche</option>
          <option value="middle">Centre</option>
          <option value="end">Droite</option>
        </select>
      </div>
    </div>
  );
}
