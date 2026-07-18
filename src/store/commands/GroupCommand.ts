import type { ElementId, GroupNode, LayerId } from "../../scene/types";
import { useSceneStore } from "../sceneStore";
import type { Command } from "./Command";
import { t } from "../../i18n";

interface ChildPosition {
  id: ElementId;
  layerId: LayerId;
  index: number;
}

function captureChildPositions(childIds: ElementId[], fallbackLayerId: LayerId): ChildPosition[] {
  const scene = useSceneStore.getState().scene;
  return childIds.map((id) => {
    const layer = scene.layers.find((l) => l.elementIds.includes(id));
    return { id, layerId: layer?.id ?? fallbackLayerId, index: layer ? layer.elementIds.indexOf(id) : 0 };
  });
}

/** Groups a set of elements under a new GroupNode — undo restores each child to its original layer/position. */
export class GroupCommand implements Command {
  label = t("command.group");
  private childPositions: ChildPosition[];

  constructor(
    private group: GroupNode,
    private groupLayerId: LayerId
  ) {
    this.childPositions = captureChildPositions(group.childIds, groupLayerId);
  }

  do() {
    const store = useSceneStore.getState();
    for (const pos of this.childPositions) {
      store.removeElementIdFromLayer(pos.layerId, pos.id);
    }
    store.addElement(this.group, this.groupLayerId);
  }

  undo() {
    const store = useSceneStore.getState();
    store.removeElement(this.group.id);
    const sorted = [...this.childPositions].sort((a, b) => a.index - b.index);
    for (const pos of sorted) {
      store.insertElementIdInLayer(pos.layerId, pos.id, pos.index);
    }
  }
}
