import { pathToD } from "../bezier";
import { svgTransformString } from "../geometry";
import { safeNumber } from "../sanitize";
import { resolvePaint, type Scene, type SceneNode, type Style } from "../types";
import { gradientsToDefs } from "./gradientDefs";

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// A loaded `.svgatelier` project file is untrusted, unvalidated JSON: every value interpolated
// below is sanitized (numbers coerced via safeNumber, strings escaped) so a crafted file can't
// break out of an attribute and inject markup into the exported SVG.
const TEXT_ANCHORS = new Set(["start", "middle", "end"]);

function safeTextAnchor(value: unknown): string {
  return typeof value === "string" && TEXT_ANCHORS.has(value) ? value : "start";
}

function styleAttrs(style: Style): string {
  const attrs = [
    `fill="${escapeAttr(resolvePaint(style.fill))}"`,
    `fill-opacity="${safeNumber(style.fillOpacity, 1)}"`,
    `stroke="${escapeAttr(resolvePaint(style.stroke))}"`,
    `stroke-width="${safeNumber(style.strokeWidth, 1)}"`,
    `stroke-opacity="${safeNumber(style.strokeOpacity, 1)}"`,
  ];
  if (style.strokeDasharray) {
    attrs.push(`stroke-dasharray="${escapeAttr(String(style.strokeDasharray))}"`);
  }
  if (style.opacity !== 1) {
    attrs.push(`opacity="${safeNumber(style.opacity, 1)}"`);
  }
  return attrs.join(" ");
}

function nodeToSvg(node: SceneNode): string {
  const transform = svgTransformString(node);
  const style = styleAttrs(node.style);

  switch (node.type) {
    case "rect": {
      const width = safeNumber(node.width);
      const height = safeNumber(node.height);
      const rx = node.rx ? ` rx="${safeNumber(node.rx)}"` : "";
      const ry = node.ry ? ` ry="${safeNumber(node.ry)}"` : "";
      return `<rect width="${width}" height="${height}"${rx}${ry} transform="${transform}" ${style}/>`;
    }
    case "ellipse":
      return `<ellipse cx="0" cy="0" rx="${safeNumber(node.rx)}" ry="${safeNumber(node.ry)}" transform="${transform}" ${style}/>`;
    case "line":
      return `<line x1="0" y1="0" x2="${safeNumber(node.x2)}" y2="${safeNumber(node.y2)}" transform="${transform}" ${style}/>`;
    case "polygon": {
      const points = node.points.map((p) => `${safeNumber(p.x)},${safeNumber(p.y)}`).join(" ");
      return `<polygon points="${points}" transform="${transform}" ${style}/>`;
    }
    case "path":
      return `<path d="${pathToD(node)}" transform="${transform}" ${style}/>`;
    case "text":
      return `<text x="0" y="0" transform="${transform}" font-family="${escapeAttr(String(node.fontFamily))}" font-size="${safeNumber(node.fontSize, 16)}" font-weight="${safeNumber(node.fontWeight, 400)}" text-anchor="${safeTextAnchor(node.textAnchor)}" ${style}>${escapeText(String(node.content))}</text>`;
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
