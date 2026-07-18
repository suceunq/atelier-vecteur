import { isBooleanCapable, booleanOpToPathNode, type BooleanOpKind } from "../../scene/booleanOps";
import type { LayerId, SceneNode } from "../../scene/types";
import { BooleanOpCommand } from "../../store/commands/BooleanOpCommand";
import { useHistoryStore } from "../../store/historyStore";
import { useSceneStore } from "../../store/sceneStore";
import { useSelectionStore } from "../../store/selectionStore";
import { useI18n } from "../../i18n/useI18n";

/** Selected nodes in bottom-to-top z-order (scene.layers, then each layer's elementIds, are both stored bottom-to-top). */
function orderedSelectedNodes(): { nodes: SceneNode[]; layerId: LayerId } | null {
  const { selectedIds } = useSelectionStore.getState();
  const { scene } = useSceneStore.getState();
  const zOrder = scene.layers.flatMap((l) => l.elementIds.map((id) => ({ id, layerId: l.id })));
  const ordered = zOrder.filter((entry) => selectedIds.includes(entry.id));
  if (ordered.length < 2) return null;
  const nodes = ordered.map((entry) => scene.elements[entry.id]).filter((n): n is SceneNode => Boolean(n));
  if (nodes.length < 2 || !nodes.every(isBooleanCapable)) return null;
  // The new shape replaces the topmost source shape in its own layer.
  return { nodes, layerId: ordered[ordered.length - 1].layerId };
}

function runBooleanOp(kind: BooleanOpKind) {
  const selection = orderedSelectedNodes();
  if (!selection) return;
  const { nodes, layerId } = selection;
  const topmost = nodes[nodes.length - 1];
  const result = booleanOpToPathNode(kind, nodes, topmost.style);
  if (!result) return;
  useHistoryStore.getState().execute(new BooleanOpCommand(kind, nodes.map((n) => n.id), result, layerId));
  useSelectionStore.getState().select([result.id]);
}

export function BooleanPanel() {
  const { t } = useI18n();
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const canCombine = selectedIds.length >= 2;

  return (
    <div className="panel boolean-panel">
      <h3>{t("boolean.title")}</h3>
      <div className="align-buttons">
        <button disabled={!canCombine} title={t("boolean.union")} onClick={() => runBooleanOp("union")}>
          ⊕
        </button>
        <button disabled={!canCombine} title={t("boolean.subtract")} onClick={() => runBooleanOp("subtract")}>
          ⊖
        </button>
        <button disabled={!canCombine} title={t("boolean.intersect")} onClick={() => runBooleanOp("intersect")}>
          ⊙
        </button>
        <button disabled={!canCombine} title={t("boolean.exclude")} onClick={() => runBooleanOp("exclude")}>
          ⊗
        </button>
      </div>
    </div>
  );
}
