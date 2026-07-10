import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyScene, createGradient } from "../../scene/factory";
import { GradientCommand } from "./GradientCommand";
import { useHistoryStore } from "../historyStore";
import { useSceneStore } from "../sceneStore";

beforeEach(() => {
  useSceneStore.setState({ scene: createEmptyScene() });
  useHistoryStore.setState({ undoStack: [], redoStack: [] });
});

describe("GradientCommand", () => {
  it("round-trips a stop-color change through undo/redo", () => {
    const gradient = createGradient("linear", { x: 0, y: 0 }, { x: 100, y: 0 });
    useSceneStore.getState().addGradient(gradient);

    const before = gradient;
    const after = { ...gradient, stops: gradient.stops.map((s, i) => (i === 0 ? { ...s, color: "#ff0000" } : s)) };

    useHistoryStore.getState().execute(new GradientCommand(gradient.id, before, after));
    expect(useSceneStore.getState().scene.gradients[gradient.id].stops[0].color).toBe("#ff0000");

    useHistoryStore.getState().undo();
    expect(useSceneStore.getState().scene.gradients[gradient.id].stops[0].color).toBe(before.stops[0].color);

    useHistoryStore.getState().redo();
    expect(useSceneStore.getState().scene.gradients[gradient.id].stops[0].color).toBe("#ff0000");
  });

  it("round-trips a linear/radial kind toggle", () => {
    const gradient = createGradient("linear", { x: 0, y: 0 }, { x: 50, y: 50 });
    useSceneStore.getState().addGradient(gradient);

    const before = gradient;
    const after = { ...gradient, kind: "radial" as const };
    useHistoryStore.getState().execute(new GradientCommand(gradient.id, before, after));
    expect(useSceneStore.getState().scene.gradients[gradient.id].kind).toBe("radial");

    useHistoryStore.getState().undo();
    expect(useSceneStore.getState().scene.gradients[gradient.id].kind).toBe("linear");
  });
});
