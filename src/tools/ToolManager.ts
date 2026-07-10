import { EllipseTool } from "./EllipseTool";
import { LineTool } from "./LineTool";
import { NodeEditTool } from "./NodeEditTool";
import { PenTool } from "./PenTool";
import { PolygonTool } from "./PolygonTool";
import { RectTool } from "./RectTool";
import { SelectTool } from "./SelectTool";
import { TextTool } from "./TextTool";
import type { Tool } from "./types";

const registry = {
  select: new SelectTool(),
  rect: new RectTool(),
  ellipse: new EllipseTool(),
  line: new LineTool(),
  polygon: new PolygonTool(),
  pen: new PenTool(),
  nodeEdit: new NodeEditTool(),
  text: new TextTool(),
} as const;

export type ToolId = keyof typeof registry;

export function getTool(id: ToolId): Tool {
  return registry[id];
}
