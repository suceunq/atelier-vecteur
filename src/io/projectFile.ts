import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { isPlausibleScene } from "../scene/validate";
import { useSceneStore } from "../store/sceneStore";
import { useDocumentStore } from "../store/documentStore";
import { t } from "../i18n";

const CURRENT_FORMAT_VERSION = 1;
const fileFilters = () => [{ name: t("file.project"), extensions: ["svgatelier"] }];

export async function saveProjectAs(): Promise<string | null> {
  const path = await save({ filters: fileFilters(), defaultPath: `${t("file.untitled")}.svgatelier` });
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
  const path = await open({ filters: fileFilters(), multiple: false });
  if (!path || Array.isArray(path)) return null;
  const result = await invoke<{ manifest: { format_version: number; app_version: string }; scene: unknown }>(
    "load_project",
    { path }
  );
  if (!Number.isInteger(result.manifest?.format_version) || result.manifest.format_version < 1) {
    throw new Error(t("error.fileVersion"));
  }
  if (result.manifest.format_version > CURRENT_FORMAT_VERSION) {
    throw new Error(t("error.fileFuture"));
  }
  if (!isPlausibleScene(result.scene)) {
    throw new Error(t("error.fileInvalid"));
  }
  useSceneStore.getState().replaceScene(result.scene);
  useDocumentStore.getState().markSaved(path);
  await invoke("clear_recovery");
  return path;
}
