import type { ElementId, LayerId, PathNode, SceneNode } from "../../scene/types";
import type { BooleanOpKind } from "../../scene/booleanOps";
import { useSceneStore } from "../sceneStore";
import type { Command } from "./Command";
import { t, type MessageKey } from "../../i18n";

const LABEL_KEY: Record<BooleanOpKind, MessageKey> = {
  union: "command.booleanUnion",
  subtract: "command.booleanSubtract",
  intersect: "command.booleanIntersect",
  exclude: "command.booleanExclude",
};

interface ElementPosition {
  node: SceneNode;
  layerId: LayerId;
  index: number;
}

function captureElementPositions(elementIds: ElementId[], fallbackLayerId: LayerId): ElementPosition[] {
  const scene = useSceneStore.getState().scene;
  return elementIds.map((id) => {
    const layer = scene.layers.find((l) => l.elementIds.includes(id));
    return { node: scene.elements[id], layerId: layer?.id ?? fallbackLayerId, index: layer ? layer.elementIds.indexOf(id) : 0 };
  });
}

/** Replaces N selected shapes with one new PathNode from a boolean operation — undo restores each original shape to its layer/position. */
export class BooleanOpCommand implements Command {
  label: string;
  private positions: ElementPosition[];

  constructor(
    kind: BooleanOpKind,
    sourceIds: ElementId[],
    private result: PathNode,
    private resultLayerId: LayerId
  ) {
    this.label = t(LABEL_KEY[kind]);
    this.positions = captureElementPositions(sourceIds, resultLayerId);
  }

  do() {
    const store = useSceneStore.getState();
    for (const pos of this.positions) store.removeElement(pos.node.id);
    store.addElement(this.result, this.resultLayerId);
  }

  undo() {
    const store = useSceneStore.getState();
    store.removeElement(this.result.id);
    const sorted = [...this.positions].sort((a, b) => a.index - b.index);
    for (const pos of sorted) {
      store.addElementOnly(pos.node);
      store.insertElementIdInLayer(pos.layerId, pos.node.id, pos.index);
    }
  }
}
