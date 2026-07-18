import { useToolStore, type ToolId } from "../store/toolStore";
import { useI18n } from "../i18n/useI18n";
import type { MessageKey } from "../i18n";

const TOOLS: { id: ToolId; label: MessageKey; icon: string; shortcut: string }[] = [
  { id: "select", label: "tool.select", icon: "⭰", shortcut: "V" }, { id: "rect", label: "tool.rect", icon: "▭", shortcut: "R" }, { id: "ellipse", label: "tool.ellipse", icon: "◯", shortcut: "E" }, { id: "line", label: "tool.line", icon: "╱", shortcut: "L" }, { id: "polygon", label: "tool.polygon", icon: "⬡", shortcut: "G" }, { id: "pen", label: "tool.pen", icon: "✒", shortcut: "P" }, { id: "text", label: "tool.text", icon: "T", shortcut: "T" },
];

export function Toolbar() {
  const { t } = useI18n();
  const activeTool = useToolStore((s) => s.activeTool);
  const setActiveTool = useToolStore((s) => s.setActiveTool);

  return (
    <div className="toolbar">
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          className={`toolbar-button ${activeTool === tool.id ? "toolbar-button-active" : ""}`}
          title={`${t(tool.label)} (${tool.shortcut})`}
          aria-label={t(tool.label)}
          onClick={() => setActiveTool(tool.id)}
        >
          <span className="toolbar-icon">{tool.icon}</span>
        </button>
      ))}
    </div>
  );
}
