import type { ElementId, GroupNode, LayerId } from "../../scene/types";
import { useSceneStore } from "../sceneStore";
import type { Command } from "./Command";
import { t } from "../../i18n";

/** Ungroups a GroupNode back into its children at the group's former position — undo restores the group. */
export class UngroupCommand implements Command {
  label = t("command.ungroup");
  private childIds: ElementId[];
  private groupIndex: number;

  constructor(
    private group: GroupNode,
    private layerId: LayerId
  ) {
    this.childIds = [...group.childIds];
    const layer = useSceneStore.getState().scene.layers.find((l) => l.id === layerId);
    this.groupIndex = layer ? layer.elementIds.indexOf(group.id) : 0;
  }

  do() {
    const store = useSceneStore.getState();
    store.removeElement(this.group.id);
    this.childIds.forEach((id, i) => {
      store.insertElementIdInLayer(this.layerId, id, this.groupIndex + i);
    });
  }

  undo() {
    const store = useSceneStore.getState();
    for (const id of this.childIds) {
      store.removeElementIdFromLayer(this.layerId, id);
    }
    store.addElement(this.group, this.layerId);
    store.reorderElement(this.layerId, this.group.id, this.groupIndex);
  }
}
