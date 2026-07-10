import { CanvasViewport } from "../canvas/CanvasViewport";
import { TextEditOverlay } from "../canvas/TextEditOverlay";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { AlignPanel } from "../panels/AlignPanel/AlignPanel";
import { GradientPanel } from "../panels/GradientPanel/GradientPanel";
import { LayersPanel } from "../panels/LayersPanel/LayersPanel";
import { PropertiesPanel } from "../panels/PropertiesPanel/PropertiesPanel";
import { MenuBar } from "./MenuBar";
import { StatusBar } from "./StatusBar";
import { Toolbar } from "./Toolbar";

export function Workspace() {
  useKeyboardShortcuts();

  return (
    <div className="workspace">
      <MenuBar />
      <div className="workspace-body">
        <Toolbar />
        <div className="canvas-area">
          <CanvasViewport />
          <TextEditOverlay />
        </div>
        <div className="side-panels">
          <PropertiesPanel />
          <GradientPanel />
          <AlignPanel />
          <LayersPanel />
        </div>
      </div>
      <StatusBar />
    </div>
  );
}
