import { localToWorldPoint } from "../scene/geometry";
import { gradientIdFromRef, isGradientRef, type SceneNode } from "../scene/types";
import { useSceneStore } from "../store/sceneStore";
import { useViewportStore } from "../store/viewportStore";

const HANDLE_SCREEN_SIZE = 10;

/** Draggable from/to handles for the selected node's gradient fill — only rendered when it has one. */
export function GradientHandles({ node }: { node: SceneNode }) {
  const gradients = useSceneStore((s) => s.scene.gradients);
  const zoom = useViewportStore((s) => s.zoom);

  if (!isGradientRef(node.style.fill)) return null;
  const gradient = gradients[gradientIdFromRef(node.style.fill)];
  if (!gradient) return null;

  const from = localToWorldPoint(node, gradient.from);
  const to = localToWorldPoint(node, gradient.to);
  const size = HANDLE_SCREEN_SIZE / zoom;
  const strokeWidth = 1 / zoom;

  return (
    <g>
      <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#f59e0b" strokeWidth={strokeWidth} />
      <circle
        cx={from.x}
        cy={from.y}
        r={size / 2}
        fill="#f59e0b"
        stroke="white"
        strokeWidth={strokeWidth}
        data-handle="gradient-from"
      />
      <circle
        cx={to.x}
        cy={to.y}
        r={size / 2}
        fill="white"
        stroke="#f59e0b"
        strokeWidth={strokeWidth}
        data-handle="gradient-to"
      />
    </g>
  );
}
