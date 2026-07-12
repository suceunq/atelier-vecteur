import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyScene, createPattern } from "../../scene/factory";
import { PatternCommand } from "./PatternCommand";
import { useHistoryStore } from "../historyStore";
import { useSceneStore } from "../sceneStore";

beforeEach(() => {
  useSceneStore.setState({ scene: createEmptyScene() });
  useHistoryStore.setState({ undoStack: [], redoStack: [] });
});

describe("PatternCommand", () => {
  it("round-trips a size change through undo/redo", () => {
    const pattern = createPattern("dots");
    useSceneStore.getState().addPattern(pattern);

    const before = pattern;
    const after = { ...pattern, size: 30 };
    useHistoryStore.getState().execute(new PatternCommand(pattern.id, before, after));
    expect(useSceneStore.getState().scene.patterns[pattern.id].size).toBe(30);

    useHistoryStore.getState().undo();
    expect(useSceneStore.getState().scene.patterns[pattern.id].size).toBe(before.size);

    useHistoryStore.getState().redo();
    expect(useSceneStore.getState().scene.patterns[pattern.id].size).toBe(30);
  });
});
