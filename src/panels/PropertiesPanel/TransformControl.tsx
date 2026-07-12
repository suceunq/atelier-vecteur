import { useState } from "react";
import type { Transform } from "../../scene/types";
import { useHistoryStore } from "../../store/historyStore";
import { useSceneStore } from "../../store/sceneStore";
import { TransformCommand } from "../../store/commands/TransformCommand";

export function TransformControl({ id, transform }: { id: string; transform: Transform }) {
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
      <h4>Position et transformation</h4>
      <div className="transform-grid">
        {numberField("X", transform.x, "x", "px")}
        {numberField("Y", transform.y, "y", "px")}
        {numberField("Rotation", transform.rotation, "rotation", "°")}
        {numberField("Échelle X", transform.scaleX, "scaleX")}
        {numberField("Échelle Y", transform.scaleY, "scaleY")}
      </div>
      <label className="inline-toggle">
        <input type="checkbox" checked={locked} onChange={(event) => setLocked(event.target.checked)} />
        Conserver les proportions
      </label>
    </section>
  );
}
