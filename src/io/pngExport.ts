import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { sceneToSvg } from "../scene/serializer/toSvg";
import { useSceneStore } from "../store/sceneStore";

export async function exportPng(width: number, height: number): Promise<string | null> {
  const path = await save({
    filters: [{ name: "Image PNG", extensions: ["png"] }],
    defaultPath: "sans-titre.png",
  });
  if (!path) return null;
  const svg = sceneToSvg(useSceneStore.getState().scene);
  await invoke("export_png", { svg, path, width: Math.round(width), height: Math.round(height) });
  return path;
}
