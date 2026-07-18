import type { Style } from "../../scene/types";
import { useI18n } from "../../i18n/useI18n";

interface Props {
  style: Style;
  onChange: (patch: Partial<Style>) => void;
}

export function StrokeControl({ style, onChange }: Props) {
  const { t } = useI18n();
  const presets = [{ label: t("panel.solid"), value: null }, { label: t("panel.dashed"), value: "6 4" }, { label: t("panel.dotted"), value: "1 4" }];
  const isNone = style.stroke === "none";
  return (
    <div className="prop-row">
      <label>{t("panel.stroke")}</label>
      <div className="prop-row-controls">
        <input
          type="checkbox"
          checked={!isNone}
          title={t("panel.enableStroke")}
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
          {presets.map((preset) => (
            <option key={preset.label} value={preset.value ?? ""}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
