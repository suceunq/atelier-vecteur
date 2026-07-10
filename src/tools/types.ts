import type { Point } from "../scene/types";
import type { Viewport } from "../canvas/viewportMath";

export interface PointerInfo {
  /** Position in scene/user (document) space. */
  user: Point;
  /** Raw client (screen) position — needed for DOM-based hit-testing. */
  screen: Point;
  shiftKey: boolean;
  altKey: boolean;
  viewport: Viewport;
}

export interface Tool {
  readonly id: string;
  cursor: string;
  onPointerDown(info: PointerInfo): void;
  onPointerMove(info: PointerInfo): void;
  onPointerUp(info: PointerInfo): void;
  /** Escape: discard whatever the tool has in progress. */
  onCancel?(): void;
  /** Enter: commit whatever the tool has in progress (e.g. finish an open path). */
  onFinish?(): void;
  /** Double-click: some tools use this instead of a single click (e.g. entering node-edit). */
  onDoubleClick?(info: PointerInfo): void;
}
