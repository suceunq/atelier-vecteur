import { CanvasViewport } from "../canvas/CanvasViewport";
import { TextEditOverlay } from "../canvas/TextEditOverlay";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useDocumentSafety } from "../hooks/useDocumentSafety";
import { AlignPanel } from "../panels/AlignPanel/AlignPanel";
import { BooleanPanel } from "../panels/BooleanPanel/BooleanPanel";
import { ArtboardPanel } from "../panels/ArtboardPanel/ArtboardPanel";
import { FiltersPanel } from "../panels/FiltersPanel/FiltersPanel";
import { GradientPanel } from "../panels/GradientPanel/GradientPanel";
import { LayersPanel } from "../panels/LayersPanel/LayersPanel";
import { PatternPanel } from "../panels/PatternPanel/PatternPanel";
import { PropertiesPanel } from "../panels/PropertiesPanel/PropertiesPanel";
import { MenuBar } from "./MenuBar";
import { StatusBar } from "./StatusBar";
import { Toolbar } from "./Toolbar";
import { useEffect } from "react";
import { loadRemoteDonationUrl } from "../config/runtimeConfig";
import { useSettingsStore } from "../store/settingsStore";

export function Workspace() {
  useKeyboardShortcuts();
  useDocumentSafety();

  useEffect(() => {
    void loadRemoteDonationUrl().then((url) => {
      if (url) useSettingsStore.getState().setRemoteDonationUrl(url);
    });
  }, []);

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
          <PatternPanel />
          <FiltersPanel />
          <AlignPanel />
          <BooleanPanel />
          <LayersPanel />
          <ArtboardPanel />
        </div>
      </div>
      <StatusBar />
    </div>
  );
}
