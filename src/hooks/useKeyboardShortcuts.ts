import { useEffect } from "react";
import { getTool } from "../tools/ToolManager";
import type { NodeEditTool } from "../tools/NodeEditTool";
import { DeleteCommand } from "../store/commands/DeleteCommand";
import { useHistoryStore } from "../store/historyStore";
import { useSelectionStore } from "../store/selectionStore";
import { useToolStore } from "../store/toolStore";
import type { ToolId } from "../tools/ToolManager";

const TOOL_SHORTCUTS: Record<string, ToolId> = {
  v: "select",
  r: "rect",
  e: "ellipse",
  l: "line",
  g: "polygon",
  p: "pen",
  t: "text",
};

export function useKeyboardShortcuts() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      const isUndo = (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z";
      const isRedo =
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z") ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y");

      if (isUndo) {
        e.preventDefault();
        useHistoryStore.getState().undo();
        return;
      }
      if (isRedo) {
        e.preventDefault();
        useHistoryStore.getState().redo();
        return;
      }

      if (typing) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        const activeTool = useToolStore.getState().activeTool;
        if (activeTool === "nodeEdit") {
          e.preventDefault();
          (getTool("nodeEdit") as NodeEditTool).deleteSelectedAnchor();
          return;
        }
        const selectedIds = useSelectionStore.getState().selectedIds;
        if (selectedIds.length > 0) {
          e.preventDefault();
          useHistoryStore.getState().execute(new DeleteCommand(selectedIds));
          useSelectionStore.getState().clear();
        }
        return;
      }

      const tool = TOOL_SHORTCUTS[e.key.toLowerCase()];
      if (tool && !e.ctrlKey && !e.metaKey) {
        useToolStore.getState().setActiveTool(tool);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
