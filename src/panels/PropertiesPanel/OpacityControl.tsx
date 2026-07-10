import type { Style } from "../../scene/types";

interface Props {
  style: Style;
  onChange: (patch: Partial<Style>) => void;
}

export function OpacityControl({ style, onChange }: Props) {
  return (
    <div className="prop-row">
      <label>Opacité</label>
      <div className="prop-row-controls">
        <input
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={style.opacity}
          onChange={(e) => onChange({ opacity: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}
