import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { sceneToSvg } from "../scene/serializer/toSvg";
import { useSceneStore } from "../store/sceneStore";
import { t } from "../i18n";

export async function exportSvg(): Promise<string | null> {
  const path = await save({
    filters: [{ name: `${t("file.image")} SVG`, extensions: ["svg"] }], defaultPath: `${t("file.untitled")}.svg`,
  });
  if (!path) return null;
  const svg = sceneToSvg(useSceneStore.getState().scene);
  await invoke("export_svg", { svg, path });
  return path;
}
