import { useSelectionStore } from "../store/selectionStore";
import { useViewportStore } from "../store/viewportStore";
import { useDocumentStore } from "../store/documentStore";
import { useI18n } from "../i18n/useI18n";

export function StatusBar() {
  const { t } = useI18n();
  const zoom = useViewportStore((s) => s.zoom);
  const cursorUser = useViewportStore((s) => s.cursorUser);
  const selectedCount = useSelectionStore((s) => s.selectedIds.length);
  const snapEnabled = useViewportStore((s) => s.snapEnabled);
  const dirty = useDocumentStore((s) => s.dirty);
  const currentPath = useDocumentStore((s) => s.currentPath);

  return (
    <div className="status-bar">
      <span>{cursorUser ? `x: ${cursorUser.x.toFixed(0)}  y: ${cursorUser.y.toFixed(0)}` : ""}</span>
      <span>{dirty ? `${t("status.modified")}${currentPath ? "" : ` — ${t("status.untitled")}`}` : t("status.saved")}</span>
      <span>{selectedCount > 0 ? t("status.selected", { count: selectedCount }) : ""}</span>
      <button className={snapEnabled ? "status-toggle active" : "status-toggle"} onClick={() => useViewportStore.getState().toggleSnap()}>
        {snapEnabled ? t("status.snapOn") : t("status.snapOff")}
      </button>
      <span>{Math.round(zoom * 100)}%</span>
    </div>
  );
}
