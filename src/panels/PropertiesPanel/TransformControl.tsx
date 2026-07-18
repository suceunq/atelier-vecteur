import { useState } from "react";
import type { Transform } from "../../scene/types";
import { useHistoryStore } from "../../store/historyStore";
import { useSceneStore } from "../../store/sceneStore";
import { TransformCommand } from "../../store/commands/TransformCommand";
import { useI18n } from "../../i18n/useI18n";

export function TransformControl({ id, transform }: { id: string; transform: Transform }) {
  const { t } = useI18n();
  const [locked, setLocked] = useState(Math.abs(transform.scaleX - transform.scaleY) < 0.0001);

  const commit = (patch: Partial<Transform>) => {
    const current = useSceneStore.getState().scene.elements[id]?.transform;
    if (!current) return;
    const next = { ...current, ...patch };
    useHistoryStore.getState().execute(new TransformCommand({ [id]: { ...current } }, { [id]: next }));
  };

  const numberField = (label: string, value: number, key: keyof Transform, suffix = "") => (
    <label className="transform-field">
      <span>{label}</span>
      <input
        type="number"
        step={key === "rotation" ? 1 : 0.1}
        value={Number(value.toFixed(3))}
        onChange={(event) => {
          const numeric = Number(event.target.value);
          if (!Number.isFinite(numeric)) return;
          if (locked && (key === "scaleX" || key === "scaleY")) {
            commit({ scaleX: numeric, scaleY: numeric });
          } else {
            commit({ [key]: numeric });
          }
        }}
      />
      {suffix && <small>{suffix}</small>}
    </label>
  );

  return (
    <section className="transform-control">
      <h4>{t("panel.transform")}</h4>
      <div className="transform-grid">
        {numberField("X", transform.x, "x", "px")}
        {numberField("Y", transform.y, "y", "px")}
        {numberField(t("panel.rotation"), transform.rotation, "rotation", "°")}
        {numberField(t("panel.scaleX"), transform.scaleX, "scaleX")}
        {numberField(t("panel.scaleY"), transform.scaleY, "scaleY")}
      </div>
      <label className="inline-toggle">
        <input type="checkbox" checked={locked} onChange={(event) => setLocked(event.target.checked)} />
        {t("panel.keepRatio")}
      </label>
    </section>
  );
}
