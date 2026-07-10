import { worldBBox } from "../../scene/geometry";
import type { ElementId, SceneNode, Transform } from "../../scene/types";
import { TransformCommand } from "../../store/commands/TransformCommand";
import { useHistoryStore } from "../../store/historyStore";
import { useSceneStore } from "../../store/sceneStore";
import { useSelectionStore } from "../../store/selectionStore";

type AlignEdge = "left" | "right" | "top" | "bottom" | "center-h" | "center-v";
type DistributeAxis = "horizontal" | "vertical";

function selectedNodes(): SceneNode[] {
  const { selectedIds } = useSelectionStore.getState();
  const { scene } = useSceneStore.getState();
  return selectedIds.map((id) => scene.elements[id]).filter((n): n is SceneNode => Boolean(n));
}

function applyTransforms(before: Record<ElementId, Transform>, after: Record<ElementId, Transform>) {
  if (Object.keys(after).length === 0) return;
  useHistoryStore.getState().execute(new TransformCommand(before, after));
}

function align(edge: AlignEdge) {
  const nodes = selectedNodes();
  if (nodes.length < 2) return;

  const boxes = nodes.map((n) => ({ node: n, box: worldBBox(n) }));
  const minX = Math.min(...boxes.map((b) => b.box.x));
  const maxX = Math.max(...boxes.map((b) => b.box.x + b.box.width));
  const minY = Math.min(...boxes.map((b) => b.box.y));
  const maxY = Math.max(...boxes.map((b) => b.box.y + b.box.height));
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const before: Record<ElementId, Transform> = {};
  const after: Record<ElementId, Transform> = {};

  for (const { node, box } of boxes) {
    let dx = 0;
    let dy = 0;
    switch (edge) {
      case "left":
        dx = minX - box.x;
        break;
      case "right":
        dx = maxX - (box.x + box.width);
        break;
      case "top":
        dy = minY - box.y;
        break;
      case "bottom":
        dy = maxY - (box.y + box.height);
        break;
      case "center-h":
        dx = centerX - (box.x + box.width / 2);
        break;
      case "center-v":
        dy = centerY - (box.y + box.height / 2);
        break;
    }
    if (dx === 0 && dy === 0) continue;
    before[node.id] = { ...node.transform };
    after[node.id] = { ...node.transform, x: node.transform.x + dx, y: node.transform.y + dy };
  }

  applyTransforms(before, after);
}

function distribute(axis: DistributeAxis) {
  const nodes = selectedNodes();
  if (nodes.length < 3) return;

  const boxes = nodes.map((n) => ({ node: n, box: worldBBox(n) }));
  const sorted = [...boxes].sort((a, b) =>
    axis === "horizontal" ? a.box.x - b.box.x : a.box.y - b.box.y
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalSpan =
    axis === "horizontal"
      ? last.box.x + last.box.width - first.box.x
      : last.box.y + last.box.height - first.box.y;
  const totalSize = sorted.reduce((sum, b) => sum + (axis === "horizontal" ? b.box.width : b.box.height), 0);
  const gap = (totalSpan - totalSize) / (sorted.length - 1);

  const before: Record<ElementId, Transform> = {};
  const after: Record<ElementId, Transform> = {};
  let cursor = axis === "horizontal" ? first.box.x : first.box.y;

  for (const { node, box } of sorted) {
    const target = cursor;
    const current = axis === "horizontal" ? box.x : box.y;
    const delta = target - current;
    if (Math.abs(delta) > 0.001) {
      before[node.id] = { ...node.transform };
      after[node.id] =
        axis === "horizontal"
          ? { ...node.transform, x: node.transform.x + delta }
          : { ...node.transform, y: node.transform.y + delta };
    }
    cursor += (axis === "horizontal" ? box.width : box.height) + gap;
  }

  applyTransforms(before, after);
}

export function AlignPanel() {
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const canAlign = selectedIds.length >= 2;
  const canDistribute = selectedIds.length >= 3;

  return (
    <div className="panel align-panel">
      <h3>Alignement</h3>
      <div className="align-buttons">
        <button disabled={!canAlign} title="Aligner à gauche" onClick={() => align("left")}>
          ⯇
        </button>
        <button disabled={!canAlign} title="Centrer horizontalement" onClick={() => align("center-h")}>
          ⯀
        </button>
        <button disabled={!canAlign} title="Aligner à droite" onClick={() => align("right")}>
          ⯈
        </button>
        <button disabled={!canAlign} title="Aligner en haut" onClick={() => align("top")}>
          ⯅
        </button>
        <button disabled={!canAlign} title="Centrer verticalement" onClick={() => align("center-v")}>
          ⬤
        </button>
        <button disabled={!canAlign} title="Aligner en bas" onClick={() => align("bottom")}>
          ⯆
        </button>
      </div>
      <div className="align-buttons">
        <button disabled={!canDistribute} title="Distribuer horizontalement" onClick={() => distribute("horizontal")}>
          ⇔
        </button>
        <button disabled={!canDistribute} title="Distribuer verticalement" onClick={() => distribute("vertical")}>
          ⇕
        </button>
      </div>
    </div>
  );
}
