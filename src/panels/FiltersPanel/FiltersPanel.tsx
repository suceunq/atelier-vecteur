import { createFilter } from "../../scene/factory";
import { filterIdFromRef, filterRef, isFilterRef, type FilterKind } from "../../scene/types";
import { FilterCommand } from "../../store/commands/FilterCommand";
import { GenericCommand } from "../../store/commands/GenericCommand";
import { useHistoryStore } from "../../store/historyStore";
import { useSceneStore } from "../../store/sceneStore";
import { useSelectionStore } from "../../store/selectionStore";
import { t } from "../../i18n";
import { useI18n } from "../../i18n/useI18n";

export function FiltersPanel() {
  const { t: tr } = useI18n();
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
        kind === "blur" ? t("command.applyBlur") : t("command.applyShadow"),
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
        t("command.removeFilter"),
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
      <h3>{tr("filter.title")}</h3>
      {!filter ? (
        <div className="prop-row-controls">
          <button onClick={() => applyFilter("blur")}>+ {tr("filter.blur")}</button>
          <button onClick={() => applyFilter("shadow")}>+ {tr("filter.shadow")}</button>
        </div>
      ) : (
        <>
          <div className="prop-row-controls">
            <span>{filter.kind === "blur" ? tr("filter.blur") : tr("filter.shadow")}</span>
            <button onClick={removeFilter}>{tr("common.remove")}</button>
          </div>
          <div className="prop-row">
            <label>{tr("filter.radius")}</label>
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
                <label>{tr("filter.offset")}</label>
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
                <label>{tr("filter.colorOpacity")}</label>
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
