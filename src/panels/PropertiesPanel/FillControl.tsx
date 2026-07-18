import type { Style } from "../../scene/types";
import { useI18n } from "../../i18n/useI18n";

interface Props {
  style: Style;
  onChange: (patch: Partial<Style>) => void;
}

export function FillControl({ style, onChange }: Props) {
  const { t } = useI18n();
  const isNone = style.fill === "none";
  return (
    <div className="prop-row">
      <label>{t("panel.fill")}</label>
      <div className="prop-row-controls">
        <input
          type="checkbox"
          checked={!isNone}
          title={t("panel.enableFill")}
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
