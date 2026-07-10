import { localToWorldPoint } from "../scene/geometry";
import type { PathNode } from "../scene/types";
import { useViewportStore } from "../store/viewportStore";

const ANCHOR_SCREEN_SIZE = 8;
const HANDLE_SCREEN_SIZE = 6;

/** Overlay for node-edit mode: anchors, bezier handles, and their connecting lines — separate from the generic SelectionOverlay corner handles. */
export function PathNodeHandles({ node, selectedIndex }: { node: PathNode; selectedIndex: number | null }) {
  const zoom = useViewportStore((s) => s.zoom);
  const anchorSize = ANCHOR_SCREEN_SIZE / zoom;
  const handleSize = HANDLE_SCREEN_SIZE / zoom;
  const strokeWidth = 1 / zoom;

  return (
    <>
      {node.nodes.map((anchor, index) => {
        const anchorWorld = localToWorldPoint(node, anchor.anchor);
        const handleInWorld = anchor.handleIn
          ? localToWorldPoint(node, { x: anchor.anchor.x + anchor.handleIn.x, y: anchor.anchor.y + anchor.handleIn.y })
          : null;
        const handleOutWorld = anchor.handleOut
          ? localToWorldPoint(node, { x: anchor.anchor.x + anchor.handleOut.x, y: anchor.anchor.y + anchor.handleOut.y })
          : null;

        return (
          <g key={anchor.id}>
            {handleInWorld && (
              <>
                <line
                  x1={anchorWorld.x}
                  y1={anchorWorld.y}
                  x2={handleInWorld.x}
                  y2={handleInWorld.y}
                  stroke="#94a3b8"
                  strokeWidth={strokeWidth}
                />
                <circle
                  cx={handleInWorld.x}
                  cy={handleInWorld.y}
                  r={handleSize / 2}
                  fill="#f8fafc"
                  stroke="#3b82f6"
                  strokeWidth={strokeWidth}
                  data-handle={`handleIn:${index}`}
                />
              </>
            )}
            {handleOutWorld && (
              <>
                <line
                  x1={anchorWorld.x}
                  y1={anchorWorld.y}
                  x2={handleOutWorld.x}
                  y2={handleOutWorld.y}
                  stroke="#94a3b8"
                  strokeWidth={strokeWidth}
                />
                <circle
                  cx={handleOutWorld.x}
                  cy={handleOutWorld.y}
                  r={handleSize / 2}
                  fill="#f8fafc"
                  stroke="#3b82f6"
                  strokeWidth={strokeWidth}
                  data-handle={`handleOut:${index}`}
                />
              </>
            )}
            <rect
              x={anchorWorld.x - anchorSize / 2}
              y={anchorWorld.y - anchorSize / 2}
              width={anchorSize}
              height={anchorSize}
              fill={selectedIndex === index ? "#3b82f6" : "white"}
              stroke="#3b82f6"
              strokeWidth={strokeWidth}
              data-handle={`node:${index}`}
            />
          </g>
        );
      })}
    </>
  );
}
