import { useEffect } from "react";
import { getTool } from "../tools/ToolManager";
import type { NodeEditTool } from "../tools/NodeEditTool";
import { cloneNodeWithOffset, createGroup } from "../scene/factory";
import { AddElementsCommand } from "../store/commands/AddElementsCommand";
import { DeleteCommand } from "../store/commands/DeleteCommand";
import { GroupCommand } from "../store/commands/GroupCommand";
import { UngroupCommand } from "../store/commands/UngroupCommand";
import { useClipboardStore } from "../store/clipboardStore";
import { useHistoryStore } from "../store/historyStore";
import { useSceneStore } from "../store/sceneStore";
import { useSelectionStore } from "../store/selectionStore";
import { useToolStore } from "../store/toolStore";
import type { ToolId } from "../tools/ToolManager";
import { saveProject } from "../io/projectFile";

const PASTE_OFFSET = 20;

function selectedSceneNodes() {
  const { selectedIds } = useSelectionStore.getState();
  const { scene } = useSceneStore.getState();
  return selectedIds.map((id) => scene.elements[id]).filter((n): n is NonNullable<typeof n> => Boolean(n));
}

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

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveProject().catch((error) =>
          window.alert(error instanceof Error ? error.message : "Échec de l’enregistrement.")
        );
        return;
      }

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

      const isCopy = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c";
      const isPaste = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v";
      const isDuplicate = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d";

      if (isCopy && !typing) {
        const nodes = selectedSceneNodes();
        if (nodes.length > 0) {
          e.preventDefault();
          useClipboardStore.getState().setCopiedNodes(JSON.parse(JSON.stringify(nodes)));
        }
        return;
      }

      if (isPaste && !typing) {
        const copied = useClipboardStore.getState().copiedNodes;
        if (copied.length > 0) {
          e.preventDefault();
          const clones = copied.map((n) => cloneNodeWithOffset(n, PASTE_OFFSET, PASTE_OFFSET));
          const command = new AddElementsCommand(clones);
          useHistoryStore.getState().execute(command);
          useSelectionStore.getState().select(command.pastedIds);
        }
        return;
      }

      if (isDuplicate && !typing) {
        const nodes = selectedSceneNodes();
        if (nodes.length > 0) {
          e.preventDefault();
          const clones = nodes.map((n) => cloneNodeWithOffset(n, PASTE_OFFSET, PASTE_OFFSET));
          const command = new AddElementsCommand(clones);
          useHistoryStore.getState().execute(command);
          useSelectionStore.getState().select(command.pastedIds);
        }
        return;
      }

      const isGroup = (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "g";
      const isUngroup = (e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "g";

      if (isGroup && !typing) {
        const nodes = selectedSceneNodes();
        if (nodes.length >= 2) {
          e.preventDefault();
          const layerId = useSceneStore.getState().findLayerOfElement(nodes[0].id) ?? undefined;
          const group = createGroup(nodes);
          const targetLayerId = layerId ?? useSceneStore.getState().scene.layers[0].id;
          useHistoryStore.getState().execute(new GroupCommand(group, targetLayerId));
          useSelectionStore.getState().select([group.id]);
        }
        return;
      }

      if (isUngroup && !typing) {
        const nodes = selectedSceneNodes();
        if (nodes.length === 1 && nodes[0].type === "group") {
          e.preventDefault();
          const group = nodes[0];
          const layerId = useSceneStore.getState().findLayerOfElement(group.id);
          if (layerId) {
            useHistoryStore.getState().execute(new UngroupCommand(group, layerId));
            useSelectionStore.getState().select(group.childIds);
          }
        }
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
