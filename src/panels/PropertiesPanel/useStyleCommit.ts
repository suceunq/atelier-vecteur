import type { ElementId, Style } from "../../scene/types";
import { StyleChangeCommand } from "../../store/commands/StyleChangeCommand";
import { useHistoryStore } from "../../store/historyStore";
import { useSceneStore } from "../../store/sceneStore";

export function commitStyleChange(ids: ElementId[], patch: Partial<Style>) {
  const { scene } = useSceneStore.getState();
  const before: Record<ElementId, Partial<Style>> = {};
  for (const id of ids) {
    const node = scene.elements[id];
    if (!node) continue;
    const b: Partial<Style> = {};
    for (const key of Object.keys(patch) as (keyof Style)[]) {
      (b as Record<string, unknown>)[key] = node.style[key];
    }
    before[id] = b;
  }
  if (Object.keys(before).length === 0) return;
  useHistoryStore.getState().execute(new StyleChangeCommand(before, patch));
}
