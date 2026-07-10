import { useToolStore, type ToolId } from "../store/toolStore";

const TOOLS: { id: ToolId; label: string; icon: string; shortcut: string }[] = [
  { id: "select", label: "Sélection", icon: "⭰", shortcut: "V" },
  { id: "rect", label: "Rectangle", icon: "▭", shortcut: "R" },
  { id: "ellipse", label: "Ellipse", icon: "◯", shortcut: "E" },
  { id: "line", label: "Ligne", icon: "╱", shortcut: "L" },
  { id: "polygon", label: "Polygone", icon: "⬡", shortcut: "G" },
  { id: "pen", label: "Plume", icon: "✒", shortcut: "P" },
  { id: "text", label: "Texte", icon: "T", shortcut: "T" },
];

export function Toolbar() {
  const activeTool = useToolStore((s) => s.activeTool);
  const setActiveTool = useToolStore((s) => s.setActiveTool);

  return (
    <div className="toolbar">
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          className={`toolbar-button ${activeTool === tool.id ? "toolbar-button-active" : ""}`}
          title={`${tool.label} (${tool.shortcut})`}
          onClick={() => setActiveTool(tool.id)}
        >
          <span className="toolbar-icon">{tool.icon}</span>
        </button>
      ))}
    </div>
  );
}
