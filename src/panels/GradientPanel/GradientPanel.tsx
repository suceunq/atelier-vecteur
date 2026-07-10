import { createGradient } from "../../scene/factory";
import { worldBBox } from "../../scene/geometry";
import { gradientIdFromRef, gradientRef, isGradientRef } from "../../scene/types";
import { GenericCommand } from "../../store/commands/GenericCommand";
import { GradientCommand } from "../../store/commands/GradientCommand";
import { useHistoryStore } from "../../store/historyStore";
import { useSceneStore } from "../../store/sceneStore";
import { useSelectionStore } from "../../store/selectionStore";
import { GradientStopList } from "./GradientStopList";

export function GradientPanel() {
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const scene = useSceneStore((s) => s.scene);

  if (selectedIds.length !== 1) return null;
  const node = scene.elements[selectedIds[0]];
  if (!node) return null;

  const fillIsGradient = isGradientRef(node.style.fill);
  const gradient = fillIsGradient ? scene.gradients[gradientIdFromRef(node.style.fill)] : null;

  const applyGradient = () => {
    const box = worldBBox(node);
    const gradientObj = createGradient(
      "linear",
      { x: box.x, y: box.y + box.height / 2 },
      { x: box.x + box.width, y: box.y + box.height / 2 }
    );
    const previousFill = node.style.fill;
    useHistoryStore.getState().execute(
      new GenericCommand(
        "Appliquer un dégradé",
        () => {
          useSceneStore.getState().addGradient(gradientObj);
          useSceneStore.getState().updateElementStyle(node.id, { fill: gradientRef(gradientObj.id) });
        },
        () => {
          useSceneStore.getState().updateElementStyle(node.id, { fill: previousFill });
          useSceneStore.getState().removeGradient(gradientObj.id);
        }
      )
    );
  };

  const removeGradientFromFill = () => {
    if (!gradient) return;
    const snapshot = gradient;
    const fallbackColor = snapshot.stops[0]?.color ?? "#3b82f6";
    useHistoryStore.getState().execute(
      new GenericCommand(
        "Retirer le dégradé",
        () => {
          useSceneStore.getState().updateElementStyle(node.id, { fill: fallbackColor });
          useSceneStore.getState().removeGradient(snapshot.id);
        },
        () => {
          useSceneStore.getState().addGradient(snapshot);
          useSceneStore.getState().updateElementStyle(node.id, { fill: gradientRef(snapshot.id) });
        }
      )
    );
  };

  const toggleKind = () => {
    if (!gradient) return;
    const before = gradient;
    const after = { ...gradient, kind: (gradient.kind === "linear" ? "radial" : "linear") as "linear" | "radial" };
    useHistoryStore.getState().execute(new GradientCommand(gradient.id, before, after));
  };

  return (
    <div className="panel gradient-panel">
      <h3>Dégradé</h3>
      {!gradient ? (
        <button onClick={applyGradient}>Appliquer un dégradé au remplissage</button>
      ) : (
        <>
          <div className="prop-row-controls">
            <button onClick={toggleKind}>{gradient.kind === "linear" ? "Linéaire" : "Radial"}</button>
            <button onClick={removeGradientFromFill}>Retirer</button>
          </div>
          <GradientStopList gradient={gradient} />
        </>
      )}
    </div>
  );
}
