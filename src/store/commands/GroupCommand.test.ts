import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyScene, createGroup, createRect } from "../../scene/factory";
import { AddElementCommand } from "./AddElementCommand";
import { GroupCommand } from "./GroupCommand";
import { UngroupCommand } from "./UngroupCommand";
import { useHistoryStore } from "../historyStore";
import { useSceneStore } from "../sceneStore";

beforeEach(() => {
  useSceneStore.setState({ scene: createEmptyScene() });
  useHistoryStore.setState({ undoStack: [], redoStack: [] });
});

describe("GroupCommand / UngroupCommand", () => {
  it("moves children out of the layer's top-level list into a group, and back on undo", () => {
    const a = createRect(0, 0, 10, 10);
    const b = createRect(20, 20, 10, 10);
    useHistoryStore.getState().execute(new AddElementCommand(a));
    useHistoryStore.getState().execute(new AddElementCommand(b));

    const layerId = useSceneStore.getState().scene.layers[0].id;
    const group = createGroup([a, b]);
    useHistoryStore.getState().execute(new GroupCommand(group, layerId));

    let layer = useSceneStore.getState().scene.layers[0];
    expect(layer.elementIds).toEqual([group.id]);
    expect(useSceneStore.getState().scene.elements[a.id]).toBeDefined();
    expect(useSceneStore.getState().scene.elements[b.id]).toBeDefined();
    expect(useSceneStore.getState().findTopLevelId(a.id)).toBe(group.id);

    useHistoryStore.getState().undo();
    layer = useSceneStore.getState().scene.layers[0];
    expect(layer.elementIds).toEqual([a.id, b.id]);
    expect(useSceneStore.getState().scene.elements[group.id]).toBeUndefined();
  });

  it("ungroups back to individual top-level elements, and restores the group on undo", () => {
    const a = createRect(0, 0, 10, 10);
    const b = createRect(20, 20, 10, 10);
    useHistoryStore.getState().execute(new AddElementCommand(a));
    useHistoryStore.getState().execute(new AddElementCommand(b));
    const layerId = useSceneStore.getState().scene.layers[0].id;
    const group = createGroup([a, b]);
    useHistoryStore.getState().execute(new GroupCommand(group, layerId));

    useHistoryStore.getState().execute(new UngroupCommand(group, layerId));
    let layer = useSceneStore.getState().scene.layers[0];
    expect(layer.elementIds).toEqual([a.id, b.id]);
    expect(useSceneStore.getState().scene.elements[group.id]).toBeUndefined();

    useHistoryStore.getState().undo();
    layer = useSceneStore.getState().scene.layers[0];
    expect(layer.elementIds).toEqual([group.id]);
  });
});
