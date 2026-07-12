import { describe, expect, it } from "vitest";
import { worldBBox } from "../scene/geometry";
import { createGroup, createRect } from "../scene/factory";
import { applyScaleResize, beginScaleResize } from "./resizeMath";

describe("scale resize (group/path/image/text)", () => {
  it("dragging the se handle grows the shape while keeping the nw corner fixed", () => {
    const group = createGroup([createRect(0, 0, 100, 50)]);
    // group.bounds is {x:0,y:0,width:100,height:50} from the single rect child; transform starts identity.
    const before = worldBBox(group);
    expect(before).toEqual({ x: 0, y: 0, width: 100, height: 50 });

    const state = beginScaleResize(group, "se");
    const { scaleX, scaleY, x, y } = applyScaleResize(state, "se", { x: 200, y: 100 });
    Object.assign(group.transform, { scaleX, scaleY, x, y });

    const after = worldBBox(group);
    expect(after.x).toBeCloseTo(0);
    expect(after.y).toBeCloseTo(0);
    expect(after.width).toBeCloseTo(200);
    expect(after.height).toBeCloseTo(100);
  });

  it("dragging the e handle only changes width, keeping height and the west edge fixed", () => {
    const group = createGroup([createRect(0, 0, 100, 50)]);
    const state = beginScaleResize(group, "e");
    const { scaleX, scaleY, x, y } = applyScaleResize(state, "e", { x: 300, y: 999 });
    Object.assign(group.transform, { scaleX, scaleY, x, y });

    const after = worldBBox(group);
    expect(after.x).toBeCloseTo(0);
    expect(after.width).toBeCloseTo(300);
    expect(after.height).toBeCloseTo(50); // untouched by a pure horizontal drag
  });

  it("dragging the nw handle keeps the opposite (se) corner fixed", () => {
    const group = createGroup([createRect(0, 0, 100, 50)]);
    const state = beginScaleResize(group, "nw");
    const { scaleX, scaleY, x, y } = applyScaleResize(state, "nw", { x: -50, y: -25 });
    Object.assign(group.transform, { scaleX, scaleY, x, y });

    const after = worldBBox(group);
    expect(after.x + after.width).toBeCloseTo(100); // se corner (100,50) unchanged
    expect(after.y + after.height).toBeCloseTo(50);
    expect(after.x).toBeCloseTo(-50);
    expect(after.y).toBeCloseTo(-25);
  });
});
