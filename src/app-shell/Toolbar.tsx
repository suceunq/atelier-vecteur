import type { ReactNode } from "react";
import { useToolStore, type ToolId } from "../store/toolStore";
import { useI18n } from "../i18n/useI18n";
import type { MessageKey } from "../i18n";

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const TOOLS: { id: ToolId; label: MessageKey; icon: ReactNode; shortcut: string }[] = [
  { id: "select", label: "tool.select", icon: <Svg><path d="M5 3l14 7-6 2-2 6z" /></Svg>, shortcut: "V" },
  { id: "rect", label: "tool.rect", icon: <Svg><rect x="3.5" y="5.5" width="17" height="13" rx="1.5" /></Svg>, shortcut: "R" },
  { id: "ellipse", label: "tool.ellipse", icon: <Svg><ellipse cx="12" cy="12" rx="9" ry="7" /></Svg>, shortcut: "E" },
  { id: "line", label: "tool.line", icon: <Svg><path d="M5 19L19 5" /></Svg>, shortcut: "L" },
  { id: "polygon", label: "tool.polygon", icon: <Svg><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /></Svg>, shortcut: "G" },
  { id: "pen", label: "tool.pen", icon: <Svg><path d="M12 19l7-7-4-4-7 7zM8 15L4 20l5-1M15 8l1-3 3 3-3 1" /></Svg>, shortcut: "P" },
  { id: "text", label: "tool.text", icon: <Svg><path d="M5 6V4h14v2M12 4v16M9 20h6" /></Svg>, shortcut: "T" },
];

export function Toolbar() {
  const { t } = useI18n();
  const activeTool = useToolStore((s) => s.activeTool);
  const setActiveTool = useToolStore((s) => s.setActiveTool);

  return (
    <div className="toolbar" role="toolbar" aria-orientation="vertical">
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          className={`toolbar-button ${activeTool === tool.id ? "toolbar-button-active" : ""}`}
          title={`${t(tool.label)} (${tool.shortcut})`}
          aria-label={t(tool.label)}
          aria-pressed={activeTool === tool.id}
          onClick={() => setActiveTool(tool.id)}
        >
          <span className="toolbar-icon">{tool.icon}</span>
        </button>
      ))}
    </div>
  );
}
