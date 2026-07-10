import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { isPlausibleScene } from "../scene/validate";
import { useSceneStore } from "../store/sceneStore";

const FILE_FILTERS = [{ name: "Projet SVG Atelier", extensions: ["svgatelier"] }];

export async function saveProjectAs(): Promise<string | null> {
  const path = await save({ filters: FILE_FILTERS, defaultPath: "sans-titre.svgatelier" });
  if (!path) return null;
  const scene = useSceneStore.getState().scene;
  await invoke("save_project", { path, scene });
  return path;
}

export async function openProject(): Promise<string | null> {
  const path = await open({ filters: FILE_FILTERS, multiple: false });
  if (!path || Array.isArray(path)) return null;
  const result = await invoke<{ manifest: { format_version: number; app_version: string }; scene: unknown }>(
    "load_project",
    { path }
  );
  if (!isPlausibleScene(result.scene)) {
    throw new Error("Fichier de projet invalide ou corrompu.");
  }
  useSceneStore.getState().replaceScene(result.scene);
  return path;
}
