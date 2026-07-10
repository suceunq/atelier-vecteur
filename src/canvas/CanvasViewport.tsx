import { useCallback, useRef, useState } from "react";
import { getTool } from "../tools/ToolManager";
import type { PointerInfo } from "../tools/types";
import { useToolStore } from "../store/toolStore";
import { useViewportStore } from "../store/viewportStore";
import { SceneRenderer } from "./SceneRenderer";
import { SelectionOverlay } from "./SelectionOverlay";
import { screenToUser, svgGroupTransform } from "./viewportMath";

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 8;

export function CanvasViewport() {
  const svgRef = useRef<SVGSVGElement>(null);
  const activeTool = useToolStore((s) => s.activeTool);
  const pan = useViewportStore((s) => s.pan);
  const zoom = useViewportStore((s) => s.zoom);
  const gridSize = useViewportStore((s) => s.gridSize);
  const showGrid = useViewportStore((s) => s.showGrid);
  const setPan = useViewportStore((s) => s.setPan);
  const setZoom = useViewportStore((s) => s.setZoom);

  const [isSpacePanning, setIsSpacePanning] = useState(false);
  const panDragRef = useRef<{ startScreen: { x: number; y: number }; startPan: { x: number; y: number } } | null>(
    null
  );

  const viewport = { pan, zoom };

  const toScreen = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) };
  }, []);

  const buildPointerInfo = useCallback(
    (e: React.PointerEvent | React.MouseEvent, screenOverride?: { x: number; y: number }): PointerInfo => {
      const screen = screenOverride ?? toScreen(e.clientX, e.clientY);
      return {
        screen: { x: e.clientX, y: e.clientY },
        user: screenToUser(screen, viewport),
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        viewport,
      };
    },
    [toScreen, viewport]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {
      // Capture can fail (e.g. NotFoundError for a pointer the browser no longer considers active) —
      // that should never block the tool from still handling the click.
    }
    if (e.button === 1 || isSpacePanning) {
      panDragRef.current = { startScreen: { x: e.clientX, y: e.clientY }, startPan: { ...pan } };
      return;
    }
    if (e.button !== 0) return;

    getTool(activeTool).onPointerDown(buildPointerInfo(e));
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    useViewportStore.getState().setCursorUser(screenToUser(toScreen(e.clientX, e.clientY), viewport));
    if (panDragRef.current) {
      const dx = e.clientX - panDragRef.current.startScreen.x;
      const dy = e.clientY - panDragRef.current.startScreen.y;
      setPan({ x: panDragRef.current.startPan.x + dx, y: panDragRef.current.startPan.y + dy });
      return;
    }
    // Forwarded unconditionally (not gated on isPointerDownRef): hover-preview tools like the pen
    // tool need move events between clicks too. Drag-only tools already no-op when idle internally.
    getTool(activeTool).onPointerMove(buildPointerInfo(e));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (panDragRef.current) {
      panDragRef.current = null;
      return;
    }
    getTool(activeTool).onPointerUp(buildPointerInfo(e));
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const screen = toScreen(e.clientX, e.clientY);
      const factor = Math.exp(-e.deltaY * 0.01);
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * factor));
      setZoom(newZoom, screen);
    } else {
      setPan({ x: pan.x - e.deltaX, y: pan.y - e.deltaY });
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.code === "Space") setIsSpacePanning(true);
      if (e.key === "Escape") getTool(activeTool).onCancel?.();
      if (e.key === "Enter") getTool(activeTool).onFinish?.();
    },
    [activeTool]
  );

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.code === "Space") setIsSpacePanning(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    getTool(activeTool).onDoubleClick?.(buildPointerInfo(e));
  };

  const gridPatternSize = gridSize * zoom;
  const gridOffsetX = pan.x % gridPatternSize;
  const gridOffsetY = pan.y % gridPatternSize;

  return (
    <svg
      ref={svgRef}
      className="canvas-viewport"
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      style={{
        cursor: isSpacePanning ? "grab" : getTool(activeTool).cursor,
        width: "100%",
        height: "100%",
        touchAction: "none",
        outline: "none",
        background: "#e2e8f0",
      }}
    >
      {showGrid && (
        <>
          <defs>
            <pattern
              id="grid-pattern"
              width={gridPatternSize}
              height={gridPatternSize}
              patternUnits="userSpaceOnUse"
              x={gridOffsetX}
              y={gridOffsetY}
            >
              <path
                d={`M ${gridPatternSize} 0 L 0 0 0 ${gridPatternSize}`}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth={1}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </>
      )}

      <g transform={svgGroupTransform(viewport)}>
        <SceneRenderer />
      </g>
      <g transform={svgGroupTransform(viewport)}>
        <SelectionOverlay />
      </g>
    </svg>
  );
}
