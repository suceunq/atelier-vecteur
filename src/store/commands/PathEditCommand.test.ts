import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyScene } from "../../scene/factory";
import { defaultStyle, defaultTransform, type PathAnchor, type PathNode } from "../../scene/types";
import { AddElementCommand } from "./AddElementCommand";
import { PathEditCommand } from "./PathEditCommand";
import { useHistoryStore } from "../historyStore";
import { useSceneStore } from "../sceneStore";

function makeAnchor(x: number, y: number): PathAnchor {
  return { id: `${x},${y}`, anchor: { x, y }, handleIn: null, handleOut: null, type: "corner" };
}

function makePath(): PathNode {
  return {
    id: "test-path",
    type: "path",
    transform: { ...defaultTransform },
    style: { ...defaultStyle },
    subpaths: [{ nodes: [makeAnchor(0, 0), makeAnchor(10, 0), makeAnchor(10, 10)], closed: false }],
  };
}

beforeEach(() => {
  useSceneStore.setState({ scene: createEmptyScene() });
  useHistoryStore.setState({ undoStack: [], redoStack: [] });
});

describe("PathEditCommand", () => {
  it("restores the exact prior anchor positions on undo", () => {
    const path = makePath();
    useHistoryStore.getState().execute(new AddElementCommand(path));

    const before = JSON.parse(JSON.stringify(path)) as PathNode;
    const after = JSON.parse(JSON.stringify(path)) as PathNode;
    after.subpaths[0].nodes[1].anchor = { x: 99, y: 99 };

    useHistoryStore.getState().execute(new PathEditCommand(path.id, before, after));

    const stored = useSceneStore.getState().scene.elements[path.id];
    expect(stored?.type).toBe("path");
    expect((stored as PathNode).subpaths[0].nodes[1].anchor).toEqual({ x: 99, y: 99 });

    useHistoryStore.getState().undo();
    const reverted = useSceneStore.getState().scene.elements[path.id] as PathNode;
    expect(reverted.subpaths[0].nodes[1].anchor).toEqual({ x: 10, y: 0 });

    useHistoryStore.getState().redo();
    const redone = useSceneStore.getState().scene.elements[path.id] as PathNode;
    expect(redone.subpaths[0].nodes[1].anchor).toEqual({ x: 99, y: 99 });
  });
});
