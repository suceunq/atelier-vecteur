import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyScene, createRect } from "../../scene/factory";
import { AddElementsCommand } from "./AddElementsCommand";
import { useHistoryStore } from "../historyStore";
import { useSceneStore } from "../sceneStore";

beforeEach(() => {
  useSceneStore.setState({ scene: createEmptyScene() });
  useHistoryStore.setState({ undoStack: [], redoStack: [] });
});

describe("AddElementsCommand", () => {
  it("adds all nodes on do() and removes all of them on undo() as a single step", () => {
    const a = createRect(0, 0, 10, 10);
    const b = createRect(20, 20, 10, 10);
    const command = new AddElementsCommand([a, b]);

    useHistoryStore.getState().execute(command);
    expect(useSceneStore.getState().scene.elements[a.id]).toBeDefined();
    expect(useSceneStore.getState().scene.elements[b.id]).toBeDefined();
    expect(command.pastedIds).toEqual([a.id, b.id]);

    useHistoryStore.getState().undo();
    expect(useSceneStore.getState().scene.elements[a.id]).toBeUndefined();
    expect(useSceneStore.getState().scene.elements[b.id]).toBeUndefined();

    useHistoryStore.getState().redo();
    expect(useSceneStore.getState().scene.elements[a.id]).toBeDefined();
    expect(useSceneStore.getState().scene.elements[b.id]).toBeDefined();
  });
});
