import { useSelectionStore } from "../store/selectionStore";
import { useViewportStore } from "../store/viewportStore";

export function StatusBar() {
  const zoom = useViewportStore((s) => s.zoom);
  const cursorUser = useViewportStore((s) => s.cursorUser);
  const selectedCount = useSelectionStore((s) => s.selectedIds.length);

  return (
    <div className="status-bar">
      <span>{cursorUser ? `x: ${cursorUser.x.toFixed(0)}  y: ${cursorUser.y.toFixed(0)}` : ""}</span>
      <span>{selectedCount > 0 ? `${selectedCount} sélectionné(s)` : ""}</span>
      <span>{Math.round(zoom * 100)}%</span>
    </div>
  );
}
