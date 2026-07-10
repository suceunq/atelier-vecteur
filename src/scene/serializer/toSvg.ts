import { pathToD } from "../bezier";
import { svgTransformString } from "../geometry";
import { resolvePaint, type Scene, type SceneNode, type Style } from "../types";
import { gradientsToDefs } from "./gradientDefs";

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function styleAttrs(style: Style): string {
  const attrs = [
    `fill="${escapeAttr(resolvePaint(style.fill))}"`,
    `fill-opacity="${style.fillOpacity}"`,
    `stroke="${escapeAttr(resolvePaint(style.stroke))}"`,
    `stroke-width="${style.strokeWidth}"`,
    `stroke-opacity="${style.strokeOpacity}"`,
  ];
  if (style.strokeDasharray) {
    attrs.push(`stroke-dasharray="${escapeAttr(style.strokeDasharray)}"`);
  }
  if (style.opacity !== 1) {
    attrs.push(`opacity="${style.opacity}"`);
  }
  return attrs.join(" ");
}

function nodeToSvg(node: SceneNode): string {
  const transform = svgTransformString(node);
  const style = styleAttrs(node.style);

  switch (node.type) {
    case "rect": {
      const rx = node.rx ? ` rx="${node.rx}"` : "";
      const ry = node.ry ? ` ry="${node.ry}"` : "";
      return `<rect width="${node.width}" height="${node.height}"${rx}${ry} transform="${transform}" ${style}/>`;
    }
    case "ellipse":
      return `<ellipse cx="0" cy="0" rx="${node.rx}" ry="${node.ry}" transform="${transform}" ${style}/>`;
    case "line":
      return `<line x1="0" y1="0" x2="${node.x2}" y2="${node.y2}" transform="${transform}" ${style}/>`;
    case "polygon": {
      const points = node.points.map((p) => `${p.x},${p.y}`).join(" ");
      return `<polygon points="${points}" transform="${transform}" ${style}/>`;
    }
    case "path":
      return `<path d="${pathToD(node)}" transform="${transform}" ${style}/>`;
    case "text":
      return `<text x="0" y="0" transform="${transform}" font-family="${escapeAttr(node.fontFamily)}" font-size="${node.fontSize}" font-weight="${node.fontWeight}" text-anchor="${node.textAnchor}" ${style}>${escapeText(node.content)}</text>`;
  }
}

/** Serializes the scene to a standalone, clean SVG document string. */
export function sceneToSvg(scene: Scene): string {
  const { width, height } = scene.artboard;
  const defs = gradientsToDefs(scene.gradients);
  const body = scene.layers
    .filter((layer) => layer.visible)
    .map((layer) => {
      const shapes = layer.elementIds
        .map((id) => scene.elements[id])
        .filter((node): node is SceneNode => Boolean(node))
        .map(nodeToSvg)
        .join("");
      return `<g>${shapes}</g>`;
    })
    .join("");

  const defsBlock = defs ? `<defs>${defs}</defs>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${defsBlock}${body}</svg>`;
}
