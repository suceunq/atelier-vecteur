import { localToWorldPoint } from "../scene/geometry";
import type { PathNode } from "../scene/types";
import type { AnchorRef } from "../store/nodeEditStore";
import { useViewportStore } from "../store/viewportStore";

const ANCHOR_SCREEN_SIZE = 8;
const HANDLE_SCREEN_SIZE = 6;

/** Overlay for node-edit mode: anchors, bezier handles, and their connecting lines — separate from the generic SelectionOverlay corner handles. */
export function PathNodeHandles({ node, selectedAnchor }: { node: PathNode; selectedAnchor: AnchorRef | null }) {
  const zoom = useViewportStore((s) => s.zoom);
  const anchorSize = ANCHOR_SCREEN_SIZE / zoom;
  const handleSize = HANDLE_SCREEN_SIZE / zoom;
  const strokeWidth = 1 / zoom;

  return (
    <>
      {node.subpaths.map((subpath, subpathIndex) => (
        <g key={subpathIndex}>
          {subpath.nodes.map((anchor, anchorIndex) => {
            const anchorWorld = localToWorldPoint(node, anchor.anchor);
            const handleInWorld = anchor.handleIn
              ? localToWorldPoint(node, {
                  x: anchor.anchor.x + anchor.handleIn.x,
                  y: anchor.anchor.y + anchor.handleIn.y,
                })
              : null;
            const handleOutWorld = anchor.handleOut
              ? localToWorldPoint(node, {
                  x: anchor.anchor.x + anchor.handleOut.x,
                  y: anchor.anchor.y + anchor.handleOut.y,
                })
              : null;
            const isSelected =
              selectedAnchor?.subpathIndex === subpathIndex && selectedAnchor?.anchorIndex === anchorIndex;

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
                      data-handle={`handleIn:${subpathIndex}:${anchorIndex}`}
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
                      data-handle={`handleOut:${subpathIndex}:${anchorIndex}`}
                    />
                  </>
                )}
                <rect
                  x={anchorWorld.x - anchorSize / 2}
                  y={anchorWorld.y - anchorSize / 2}
                  width={anchorSize}
                  height={anchorSize}
                  fill={isSelected ? "#3b82f6" : "white"}
                  stroke="#3b82f6"
                  strokeWidth={strokeWidth}
                  data-handle={`node:${subpathIndex}:${anchorIndex}`}
                />
              </g>
            );
          })}
        </g>
      ))}
    </>
  );
}
