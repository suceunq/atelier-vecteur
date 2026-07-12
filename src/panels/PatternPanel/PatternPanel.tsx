import { createPattern } from "../../scene/factory";
import { patternIdFromRef, patternRef, isPatternRef, type PatternKind } from "../../scene/types";
import { GenericCommand } from "../../store/commands/GenericCommand";
import { PatternCommand } from "../../store/commands/PatternCommand";
import { useHistoryStore } from "../../store/historyStore";
import { useSceneStore } from "../../store/sceneStore";
import { useSelectionStore } from "../../store/selectionStore";

const KIND_LABELS: Record<PatternKind, string> = {
  dots: "Points",
  stripes: "Rayures",
  grid: "Grille",
  checkerboard: "Damier",
};

export function PatternPanel() {
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const scene = useSceneStore((s) => s.scene);

  if (selectedIds.length !== 1) return null;
  const node = scene.elements[selectedIds[0]];
  if (!node) return null;

  const pattern = isPatternRef(node.style.fill) ? scene.patterns[patternIdFromRef(node.style.fill)] : null;

  const applyPattern = (kind: PatternKind) => {
    const patternObj = createPattern(kind);
    const previousFill = node.style.fill;
    useHistoryStore.getState().execute(
      new GenericCommand(
        "Appliquer un motif",
        () => {
          useSceneStore.getState().addPattern(patternObj);
          useSceneStore.getState().updateElementStyle(node.id, { fill: patternRef(patternObj.id) });
        },
        () => {
          useSceneStore.getState().updateElementStyle(node.id, { fill: previousFill });
          useSceneStore.getState().removePattern(patternObj.id);
        }
      )
    );
  };

  const removePattern = () => {
    if (!pattern) return;
    const snapshot = pattern;
    useHistoryStore.getState().execute(
      new GenericCommand(
        "Retirer le motif",
        () => {
          useSceneStore.getState().updateElementStyle(node.id, { fill: snapshot.color });
          useSceneStore.getState().removePattern(snapshot.id);
        },
        () => {
          useSceneStore.getState().addPattern(snapshot);
          useSceneStore.getState().updateElementStyle(node.id, { fill: patternRef(snapshot.id) });
        }
      )
    );
  };

  const updatePatternField = (patch: Partial<typeof pattern>) => {
    if (!pattern) return;
    useHistoryStore.getState().execute(new PatternCommand(pattern.id, pattern, { ...pattern, ...patch }));
  };

  return (
    <div className="panel pattern-panel">
      <h3>Motif</h3>
      {!pattern ? (
        <div className="prop-row-controls">
          {(Object.keys(KIND_LABELS) as PatternKind[]).map((kind) => (
            <button key={kind} onClick={() => applyPattern(kind)}>
              {KIND_LABELS[kind]}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="prop-row-controls">
            <span>{KIND_LABELS[pattern.kind]}</span>
            <button onClick={removePattern}>Retirer</button>
          </div>
          <div className="prop-row">
            <label>Taille</label>
            <input
              type="number"
              min={2}
              value={pattern.size}
              onChange={(e) => updatePatternField({ size: Number(e.target.value) })}
            />
          </div>
          <div className="prop-row">
            <label>Couleur / Fond</label>
            <div className="prop-row-controls">
              <input
                type="color"
                value={pattern.color}
                onChange={(e) => updatePatternField({ color: e.target.value })}
              />
              <input
                type="color"
                value={pattern.background}
                onChange={(e) => updatePatternField({ background: e.target.value })}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
