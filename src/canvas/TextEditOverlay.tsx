import { useEffect, useRef, useState } from "react";
import { GenericCommand } from "../store/commands/GenericCommand";
import { useHistoryStore } from "../store/historyStore";
import { useSceneStore } from "../store/sceneStore";
import { useTextEditStore } from "../store/textEditStore";
import { useViewportStore } from "../store/viewportStore";
import { userToScreen } from "./viewportMath";

/** HTML textarea overlaid on the canvas for inline text editing — the real rendering stays the SVG <text> underneath. */
export function TextEditOverlay() {
  const editingId = useTextEditStore((s) => s.editingId);
  const setEditingId = useTextEditStore((s) => s.setEditingId);
  const scene = useSceneStore((s) => s.scene);
  const pan = useViewportStore((s) => s.pan);
  const zoom = useViewportStore((s) => s.zoom);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");

  const node = editingId ? scene.elements[editingId] : null;
  const isTextNode = node?.type === "text";

  useEffect(() => {
    if (isTextNode && node) {
      setDraft(node.content);
      const id = requestAnimationFrame(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
      });
      return () => cancelAnimationFrame(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  if (!node || node.type !== "text") return null;

  const commit = () => {
    const before = node.content;
    const after = draft;
    setEditingId(null);
    if (before === after) return;
    useHistoryStore
      .getState()
      .execute(
        new GenericCommand(
          "Modifier le texte",
          () => useSceneStore.getState().updateElementGeometry(node.id, { content: after }),
          () => useSceneStore.getState().updateElementGeometry(node.id, { content: before })
        )
      );
  };

  const screenPos = userToScreen({ x: node.transform.x, y: node.transform.y }, { pan, zoom });

  return (
    <textarea
      ref={textareaRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") {
          e.preventDefault();
          setEditingId(null);
        }
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          commit();
        }
      }}
      style={{
        position: "absolute",
        left: screenPos.x,
        top: screenPos.y - node.fontSize * zoom,
        fontSize: node.fontSize * zoom,
        fontFamily: node.fontFamily,
        fontWeight: node.fontWeight,
        border: "1px dashed #3b82f6",
        background: "white",
        minWidth: "80px",
        padding: "2px",
        lineHeight: 1.2,
        outline: "none",
        resize: "none",
      }}
    />
  );
}
