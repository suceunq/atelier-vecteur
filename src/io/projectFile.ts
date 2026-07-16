import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { isPlausibleScene } from "../scene/validate";
import { useSceneStore } from "../store/sceneStore";
import { useDocumentStore } from "../store/documentStore";

const FILE_FILTERS = [{ name: "Projet SVG Atelier", extensions: ["svgatelier"] }];
const CURRENT_FORMAT_VERSION = 1;

export async function saveProjectAs(): Promise<string | null> {
  const path = await save({ filters: FILE_FILTERS, defaultPath: "sans-titre.svgatelier" });
  if (!path) return null;
  const scene = useSceneStore.getState().scene;
  await invoke("save_project", { path, scene });
  useDocumentStore.getState().markSaved(path);
  await invoke("clear_recovery");
  return path;
}

export async function saveProject(): Promise<string | null> {
  const path = useDocumentStore.getState().currentPath;
  if (!path) return saveProjectAs();
  await invoke("save_project", { path, scene: useSceneStore.getState().scene });
  useDocumentStore.getState().markSaved();
  await invoke("clear_recovery");
  return path;
}

export async function openProject(): Promise<string | null> {
  const path = await open({ filters: FILE_FILTERS, multiple: false });
  if (!path || Array.isArray(path)) return null;
  const result = await invoke<{ manifest: { format_version: number; app_version: string }; scene: unknown }>(
    "load_project",
    { path }
  );
  if (!Number.isInteger(result.manifest?.format_version) || result.manifest.format_version < 1) {
    throw new Error("Version de fichier de projet invalide.");
  }
  if (result.manifest.format_version > CURRENT_FORMAT_VERSION) {
    throw new Error("Ce projet a été créé avec une version plus récente d’Atelier Vecteur. Mettez l’application à jour pour l’ouvrir.");
  }
  if (!isPlausibleScene(result.scene)) {
    throw new Error("Fichier de projet invalide ou corrompu.");
  }
  useSceneStore.getState().replaceScene(result.scene);
  useDocumentStore.getState().markSaved(path);
  await invoke("clear_recovery");
  return path;
}
