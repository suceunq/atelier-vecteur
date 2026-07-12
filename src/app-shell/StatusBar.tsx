import { useSelectionStore } from "../store/selectionStore";
import { useViewportStore } from "../store/viewportStore";
import { useDocumentStore } from "../store/documentStore";

export function StatusBar() {
  const zoom = useViewportStore((s) => s.zoom);
  const cursorUser = useViewportStore((s) => s.cursorUser);
  const selectedCount = useSelectionStore((s) => s.selectedIds.length);
  const snapEnabled = useViewportStore((s) => s.snapEnabled);
  const dirty = useDocumentStore((s) => s.dirty);
  const currentPath = useDocumentStore((s) => s.currentPath);

  return (
    <div className="status-bar">
      <span>{cursorUser ? `x: ${cursorUser.x.toFixed(0)}  y: ${cursorUser.y.toFixed(0)}` : ""}</span>
      <span>{dirty ? `● Modifié${currentPath ? "" : " — sans titre"}` : "✓ Enregistré"}</span>
      <span>{selectedCount > 0 ? `${selectedCount} sélectionné(s)` : ""}</span>
      <button className={snapEnabled ? "status-toggle active" : "status-toggle"} onClick={() => useViewportStore.getState().toggleSnap()}>
        Aimant {snapEnabled ? "activé" : "désactivé"}
      </button>
      <span>{Math.round(zoom * 100)}%</span>
    </div>
  );
}
