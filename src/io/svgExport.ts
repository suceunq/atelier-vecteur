import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { sceneToSvg } from "../scene/serializer/toSvg";
import { useSceneStore } from "../store/sceneStore";

export async function exportSvg(): Promise<string | null> {
  const path = await save({
    filters: [{ name: "Image SVG", extensions: ["svg"] }],
    defaultPath: "sans-titre.svg",
  });
  if (!path) return null;
  const svg = sceneToSvg(useSceneStore.getState().scene);
  await invoke("export_svg", { svg, path });
  return path;
}
