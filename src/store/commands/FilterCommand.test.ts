import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyScene, createFilter } from "../../scene/factory";
import { FilterCommand } from "./FilterCommand";
import { useHistoryStore } from "../historyStore";
import { useSceneStore } from "../sceneStore";

beforeEach(() => {
  useSceneStore.setState({ scene: createEmptyScene() });
  useHistoryStore.setState({ undoStack: [], redoStack: [] });
});

describe("FilterCommand", () => {
  it("round-trips a blur radius change through undo/redo", () => {
    const filter = createFilter("blur");
    useSceneStore.getState().addFilter(filter);

    const before = filter;
    const after = { ...filter, blurRadius: 20 };
    useHistoryStore.getState().execute(new FilterCommand(filter.id, before, after));
    expect(useSceneStore.getState().scene.filters[filter.id].blurRadius).toBe(20);

    useHistoryStore.getState().undo();
    expect(useSceneStore.getState().scene.filters[filter.id].blurRadius).toBe(before.blurRadius);

    useHistoryStore.getState().redo();
    expect(useSceneStore.getState().scene.filters[filter.id].blurRadius).toBe(20);
  });
});
