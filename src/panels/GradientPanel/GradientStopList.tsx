import type { Gradient } from "../../scene/types";
import { GradientCommand } from "../../store/commands/GradientCommand";
import { useHistoryStore } from "../../store/historyStore";
import { useI18n } from "../../i18n/useI18n";

export function GradientStopList({ gradient }: { gradient: Gradient }) {
  const { t } = useI18n();
  const commit = (after: Gradient) => {
    useHistoryStore.getState().execute(new GradientCommand(gradient.id, gradient, after));
  };

  const updateStop = (index: number, patch: Partial<Gradient["stops"][number]>) => {
    const stops = gradient.stops.map((s, i) => (i === index ? { ...s, ...patch } : s));
    commit({ ...gradient, stops });
  };

  const addStop = () => {
    const stops = [...gradient.stops, { offset: 1, color: "#ffffff", opacity: 1 }];
    commit({ ...gradient, stops });
  };

  const removeStop = (index: number) => {
    if (gradient.stops.length <= 2) return;
    const stops = gradient.stops.filter((_, i) => i !== index);
    commit({ ...gradient, stops });
  };

  return (
    <div className="gradient-stop-list">
      {gradient.stops.map((stop, index) => (
        <div key={index} className="gradient-stop-row">
          <input type="color" value={stop.color} onChange={(e) => updateStop(index, { color: e.target.value })} />
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={stop.offset}
            onChange={(e) => updateStop(index, { offset: Number(e.target.value) })}
          />
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={stop.opacity}
            onChange={(e) => updateStop(index, { opacity: Number(e.target.value) })}
          />
          <button disabled={gradient.stops.length <= 2} onClick={() => removeStop(index)}>
            ✕
          </button>
        </div>
      ))}
      <button onClick={addStop}>{t("gradient.stop")}</button>
    </div>
  );
}
