import type { Style } from "../../scene/types";
import { useI18n } from "../../i18n/useI18n";

interface Props {
  style: Style;
  onChange: (patch: Partial<Style>) => void;
}

export function OpacityControl({ style, onChange }: Props) {
  const { t } = useI18n();
  return (
    <div className="prop-row">
      <label>{t("panel.opacity")}</label>
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
