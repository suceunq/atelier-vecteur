import type { Style } from "../../scene/types";

interface Props {
  style: Style;
  onChange: (patch: Partial<Style>) => void;
}

const DASH_PRESETS: { label: string; value: string | null }[] = [
  { label: "Continu", value: null },
  { label: "Tirets", value: "6 4" },
  { label: "Pointillés", value: "1 4" },
];

export function StrokeControl({ style, onChange }: Props) {
  const isNone = style.stroke === "none";
  return (
    <div className="prop-row">
      <label>Contour</label>
      <div className="prop-row-controls">
        <input
          type="checkbox"
          checked={!isNone}
          title="Activer le contour"
          onChange={(e) => onChange({ stroke: e.target.checked ? "#1e293b" : "none" })}
        />
        <input
          type="color"
          value={isNone ? "#ffffff" : style.stroke}
          disabled={isNone}
          onChange={(e) => onChange({ stroke: e.target.value })}
        />
        <input
          type="number"
          min={0}
          step={0.5}
          value={style.strokeWidth}
          disabled={isNone}
          onChange={(e) => onChange({ strokeWidth: Number(e.target.value) })}
        />
        <select
          value={style.strokeDasharray ?? ""}
          disabled={isNone}
          onChange={(e) => onChange({ strokeDasharray: e.target.value || null })}
        >
          {DASH_PRESETS.map((preset) => (
            <option key={preset.label} value={preset.value ?? ""}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
