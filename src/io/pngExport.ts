import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { sceneToSvg } from "../scene/serializer/toSvg";
import { useSceneStore } from "../store/sceneStore";
import { t } from "../i18n";

export async function exportPng(width: number, height: number): Promise<string | null> {
  const path = await save({
    filters: [{ name: `${t("file.image")} PNG`, extensions: ["png"] }], defaultPath: `${t("file.untitled")}.png`,
  });
  if (!path) return null;
  const svg = sceneToSvg(useSceneStore.getState().scene);
  await invoke("export_png", { svg, path, width: Math.round(width), height: Math.round(height) });
  return path;
}
