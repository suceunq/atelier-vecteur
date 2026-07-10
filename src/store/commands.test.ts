import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyScene, createRect } from "../scene/factory";
import { AddElementCommand } from "./commands/AddElementCommand";
import { DeleteCommand } from "./commands/DeleteCommand";
import { StyleChangeCommand } from "./commands/StyleChangeCommand";
import { TransformCommand } from "./commands/TransformCommand";
import { useHistoryStore } from "./historyStore";
import { useSceneStore } from "./sceneStore";

beforeEach(() => {
  useSceneStore.setState({ scene: createEmptyScene() });
  useHistoryStore.setState({ undoStack: [], redoStack: [] });
});

describe("AddElementCommand", () => {
  it("adds on do() and removes on undo()", () => {
    const rect = createRect(0, 0, 10, 10);
    useHistoryStore.getState().execute(new AddElementCommand(rect));

    expect(useSceneStore.getState().scene.elements[rect.id]).toBeDefined();

    useHistoryStore.getState().undo();
    expect(useSceneStore.getState().scene.elements[rect.id]).toBeUndefined();

    useHistoryStore.getState().redo();
    expect(useSceneStore.getState().scene.elements[rect.id]).toBeDefined();
  });
});

describe("DeleteCommand", () => {
  it("restores the element at its original layer and index on undo", () => {
    const rectA = createRect(0, 0, 10, 10);
    const rectB = createRect(20, 20, 10, 10);
    useHistoryStore.getState().execute(new AddElementCommand(rectA));
    useHistoryStore.getState().execute(new AddElementCommand(rectB));

    const layerId = useSceneStore.getState().scene.layers[0].id;
    useHistoryStore.getState().execute(new DeleteCommand([rectA.id]));
    expect(useSceneStore.getState().scene.elements[rectA.id]).toBeUndefined();
    expect(useSceneStore.getState().scene.layers[0].elementIds).toEqual([rectB.id]);

    useHistoryStore.getState().undo();
    expect(useSceneStore.getState().scene.elements[rectA.id]).toBeDefined();
    expect(useSceneStore.getState().scene.layers.find((l) => l.id === layerId)?.elementIds).toEqual([
      rectA.id,
      rectB.id,
    ]);
  });
});

describe("TransformCommand", () => {
  it("round-trips position changes through undo/redo", () => {
    const rect = createRect(0, 0, 10, 10);
    useHistoryStore.getState().execute(new AddElementCommand(rect));

    const before = { [rect.id]: { ...rect.transform } };
    const after = { [rect.id]: { ...rect.transform, x: 50, y: 50 } };
    useHistoryStore.getState().execute(new TransformCommand(before, after));

    expect(useSceneStore.getState().scene.elements[rect.id].transform.x).toBe(50);
    useHistoryStore.getState().undo();
    expect(useSceneStore.getState().scene.elements[rect.id].transform.x).toBe(0);
    useHistoryStore.getState().redo();
    expect(useSceneStore.getState().scene.elements[rect.id].transform.x).toBe(50);
  });
});

describe("StyleChangeCommand", () => {
  it("reverts to the exact prior style values on undo", () => {
    const rect = createRect(0, 0, 10, 10);
    useHistoryStore.getState().execute(new AddElementCommand(rect));

    const before = { [rect.id]: { fill: rect.style.fill } };
    useHistoryStore.getState().execute(new StyleChangeCommand(before, { fill: "#ff0000" }));

    expect(useSceneStore.getState().scene.elements[rect.id].style.fill).toBe("#ff0000");
    useHistoryStore.getState().undo();
    expect(useSceneStore.getState().scene.elements[rect.id].style.fill).toBe(rect.style.fill);
  });
});

describe("useHistoryStore", () => {
  it("clears the redo stack once a new command is executed", () => {
    const rectA = createRect(0, 0, 10, 10);
    const rectB = createRect(20, 20, 10, 10);
    useHistoryStore.getState().execute(new AddElementCommand(rectA));
    useHistoryStore.getState().undo();
    expect(useHistoryStore.getState().redoStack).toHaveLength(1);

    useHistoryStore.getState().execute(new AddElementCommand(rectB));
    expect(useHistoryStore.getState().redoStack).toHaveLength(0);
  });
});
