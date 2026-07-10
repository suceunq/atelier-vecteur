import { rotatedOutlineCorners, unionBBox, worldBBox, worldHandlePosition } from "../scene/geometry";
import { isGradientRef, type SceneNode } from "../scene/types";
import { useDraftStore } from "../store/draftStore";
import { useNodeEditStore } from "../store/nodeEditStore";
import { useSceneStore } from "../store/sceneStore";
import { useSelectionStore } from "../store/selectionStore";
import { useToolStore } from "../store/toolStore";
import { useViewportStore } from "../store/viewportStore";
import { GradientHandles } from "./GradientHandles";
import { PathNodeHandles } from "./PathNodeHandles";

const HANDLE_SCREEN_SIZE = 8;
const ROTATE_OFFSET_SCREEN = 24;
const CORNER_HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;

/** Selection handles/gizmos — a separate SVG layer on top of the scene, never exported. */
export function SelectionOverlay() {
  const scene = useSceneStore((s) => s.scene);
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const zoom = useViewportStore((s) => s.zoom);
  const marquee = useDraftStore((s) => s.marquee);
  const activeTool = useToolStore((s) => s.activeTool);
  const selectedAnchorIndex = useNodeEditStore((s) => s.selectedAnchorIndex);

  const strokeWidth = 1 / zoom;
  const dash = `${4 / zoom} ${4 / zoom}`;

  const nodes = selectedIds.map((id) => scene.elements[id]).filter((n): n is SceneNode => Boolean(n));
  const union = unionBBox(nodes.map(worldBBox));

  if (activeTool === "nodeEdit" && nodes.length === 1 && nodes[0].type === "path") {
    return <PathNodeHandles node={nodes[0]} selectedIndex={selectedAnchorIndex} />;
  }

  return (
    <>
      {marquee && (
        <rect
          x={marquee.x}
          y={marquee.y}
          width={marquee.width}
          height={marquee.height}
          fill="rgba(59,130,246,0.1)"
          stroke="#3b82f6"
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
        />
      )}

      {nodes.length > 1 && union && (
        <rect
          x={union.x}
          y={union.y}
          width={union.width}
          height={union.height}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={strokeWidth}
          strokeDasharray={dash}
        />
      )}

      {nodes.length === 1 && (
        <SingleSelectionHandles
          node={nodes[0]}
          zoom={zoom}
          strokeWidth={strokeWidth}
        />
      )}

      {nodes.length === 1 && isGradientRef(nodes[0].style.fill) && <GradientHandles node={nodes[0]} />}
    </>
  );
}

function SingleSelectionHandles({
  node,
  zoom,
  strokeWidth,
}: {
  node: SceneNode;
  zoom: number;
  strokeWidth: number;
}) {
  const handleSize = HANDLE_SCREEN_SIZE / zoom;
  const rotateOffset = ROTATE_OFFSET_SCREEN / zoom;

  if (node.type === "line") {
    const start = { x: node.transform.x, y: node.transform.y };
    const end = { x: node.transform.x + node.x2, y: node.transform.y + node.y2 };
    return (
      <>
        <HandleDot x={start.x} y={start.y} size={handleSize} handle="start" />
        <HandleDot x={end.x} y={end.y} size={handleSize} handle="end" />
      </>
    );
  }

  const corners = rotatedOutlineCorners(node);
  const outlinePoints = corners.map((p) => `${p.x},${p.y}`).join(" ");
  const nPos = worldHandlePosition(node, "n");
  const center = {
    x: corners.reduce((sum, p) => sum + p.x, 0) / 4,
    y: corners.reduce((sum, p) => sum + p.y, 0) / 4,
  };
  const dirX = nPos.x - center.x;
  const dirY = nPos.y - center.y;
  const dirLength = Math.hypot(dirX, dirY) || 1;
  const rotateHandlePos = {
    x: nPos.x + (dirX / dirLength) * rotateOffset,
    y: nPos.y + (dirY / dirLength) * rotateOffset,
  };

  return (
    <>
      <polygon points={outlinePoints} fill="none" stroke="#3b82f6" strokeWidth={strokeWidth} />
      <line
        x1={nPos.x}
        y1={nPos.y}
        x2={rotateHandlePos.x}
        y2={rotateHandlePos.y}
        stroke="#3b82f6"
        strokeWidth={strokeWidth}
      />
      <HandleDot x={rotateHandlePos.x} y={rotateHandlePos.y} size={handleSize} handle="rotate" round />
      {CORNER_HANDLES.map((handle) => {
        const pos = worldHandlePosition(node, handle);
        return <HandleSquare key={handle} x={pos.x} y={pos.y} size={handleSize} handle={handle} />;
      })}
    </>
  );
}

function HandleSquare({ x, y, size, handle }: { x: number; y: number; size: number; handle: string }) {
  return (
    <rect
      x={x - size / 2}
      y={y - size / 2}
      width={size}
      height={size}
      fill="white"
      stroke="#3b82f6"
      strokeWidth={size / 8}
      data-handle={handle}
    />
  );
}

function HandleDot({
  x,
  y,
  size,
  handle,
  round,
}: {
  x: number;
  y: number;
  size: number;
  handle: string;
  round?: boolean;
}) {
  if (round) {
    return (
      <circle
        cx={x}
        cy={y}
        r={size / 2}
        fill="white"
        stroke="#3b82f6"
        strokeWidth={size / 8}
        data-handle={handle}
      />
    );
  }
  return <HandleSquare x={x} y={y} size={size} handle={handle} />;
}
