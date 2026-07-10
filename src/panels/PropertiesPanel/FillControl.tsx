import type { Style } from "../../scene/types";

interface Props {
  style: Style;
  onChange: (patch: Partial<Style>) => void;
}

export function FillControl({ style, onChange }: Props) {
  const isNone = style.fill === "none";
  return (
    <div className="prop-row">
      <label>Remplissage</label>
      <div className="prop-row-controls">
        <input
          type="checkbox"
          checked={!isNone}
          title="Activer le remplissage"
          onChange={(e) => onChange({ fill: e.target.checked ? "#3b82f6" : "none" })}
        />
        <input
          type="color"
          value={isNone ? "#ffffff" : style.fill}
          disabled={isNone}
          onChange={(e) => onChange({ fill: e.target.value })}
        />
        <input
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={style.fillOpacity}
          disabled={isNone}
          onChange={(e) => onChange({ fillOpacity: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}
