import { invoke } from "@tauri-apps/api/core";
import { createId } from "../scene/factory";
import type { PathAnchor, PathSubpath, TextNode } from "../scene/types";

interface AnchorDto {
  anchor: [number, number];
  handleIn: [number, number] | null;
  handleOut: [number, number] | null;
}

interface SubpathDto {
  nodes: AnchorDto[];
  closed: boolean;
}

/** Calls the Rust `text_to_path` command and converts its output into our PathSubpath model (fresh anchor ids). */
export async function convertTextToPathSubpaths(node: TextNode): Promise<PathSubpath[]> {
  const dtos = await invoke<SubpathDto[]>("text_to_path", {
    content: node.content,
    fontFamily: node.fontFamily,
    fontSize: node.fontSize,
    fontWeight: node.fontWeight,
    textAnchor: node.textAnchor,
  });

  return dtos.map((subpath) => ({
    closed: subpath.closed,
    nodes: subpath.nodes.map(
      (n): PathAnchor => ({
        id: createId(),
        anchor: { x: n.anchor[0], y: n.anchor[1] },
        handleIn: n.handleIn ? { x: n.handleIn[0], y: n.handleIn[1] } : null,
        handleOut: n.handleOut ? { x: n.handleOut[0], y: n.handleOut[1] } : null,
        type: "corner",
      })
    ),
  }));
}
