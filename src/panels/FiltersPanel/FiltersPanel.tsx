import { createFilter } from "../../scene/factory";
import { filterIdFromRef, filterRef, isFilterRef, type FilterKind } from "../../scene/types";
import { FilterCommand } from "../../store/commands/FilterCommand";
import { GenericCommand } from "../../store/commands/GenericCommand";
import { useHistoryStore } from "../../store/historyStore";
import { useSceneStore } from "../../store/sceneStore";
import { useSelectionStore } from "../../store/selectionStore";

export function FiltersPanel() {
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const scene = useSceneStore((s) => s.scene);

  if (selectedIds.length !== 1) return null;
  const node = scene.elements[selectedIds[0]];
  if (!node) return null;

  const filter = isFilterRef(node.style.filter) ? scene.filters[filterIdFromRef(node.style.filter)] : null;

  const applyFilter = (kind: FilterKind) => {
    const filterObj = createFilter(kind);
    const previousFilter = node.style.filter;
    useHistoryStore.getState().execute(
      new GenericCommand(
        kind === "blur" ? "Appliquer un flou" : "Appliquer une ombre portée",
        () => {
          useSceneStore.getState().addFilter(filterObj);
          useSceneStore.getState().updateElementStyle(node.id, { filter: filterRef(filterObj.id) });
        },
        () => {
          useSceneStore.getState().updateElementStyle(node.id, { filter: previousFilter });
          useSceneStore.getState().removeFilter(filterObj.id);
        }
      )
    );
  };

  const removeFilter = () => {
    if (!filter) return;
    const snapshot = filter;
    useHistoryStore.getState().execute(
      new GenericCommand(
        "Retirer le filtre",
        () => {
          useSceneStore.getState().updateElementStyle(node.id, { filter: null });
          useSceneStore.getState().removeFilter(snapshot.id);
        },
        () => {
          useSceneStore.getState().addFilter(snapshot);
          useSceneStore.getState().updateElementStyle(node.id, { filter: filterRef(snapshot.id) });
        }
      )
    );
  };

  const updateFilterField = (patch: Partial<typeof filter>) => {
    if (!filter) return;
    const before = filter;
    const after = { ...filter, ...patch };
    useHistoryStore.getState().execute(new FilterCommand(filter.id, before, after));
  };

  return (
    <div className="panel filters-panel">
      <h3>Filtre</h3>
      {!filter ? (
        <div className="prop-row-controls">
          <button onClick={() => applyFilter("blur")}>+ Flou</button>
          <button onClick={() => applyFilter("shadow")}>+ Ombre portée</button>
        </div>
      ) : (
        <>
          <div className="prop-row-controls">
            <span>{filter.kind === "blur" ? "Flou" : "Ombre portée"}</span>
            <button onClick={removeFilter}>Retirer</button>
          </div>
          <div className="prop-row">
            <label>Rayon</label>
            <input
              type="number"
              min={0}
              value={filter.blurRadius}
              onChange={(e) => updateFilterField({ blurRadius: Number(e.target.value) })}
            />
          </div>
          {filter.kind === "shadow" && (
            <>
              <div className="prop-row">
                <label>Décalage X / Y</label>
                <div className="prop-row-controls">
                  <input
                    type="number"
                    value={filter.offsetX}
                    onChange={(e) => updateFilterField({ offsetX: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    value={filter.offsetY}
                    onChange={(e) => updateFilterField({ offsetY: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="prop-row">
                <label>Couleur / Opacité</label>
                <div className="prop-row-controls">
                  <input
                    type="color"
                    value={filter.color}
                    onChange={(e) => updateFilterField({ color: e.target.value })}
                  />
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={filter.opacity}
                    onChange={(e) => updateFilterField({ opacity: Number(e.target.value) })}
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
