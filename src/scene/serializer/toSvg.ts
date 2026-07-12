import { pathToD } from "../bezier";
import { svgTransformString } from "../geometry";
import { safeNumber } from "../sanitize";
import { resolveFilterRef, resolvePaint, type ArtboardId, type Scene, type SceneNode, type Style } from "../types";
import { filtersToDefs } from "./filterDefs";
import { gradientsToDefs } from "./gradientDefs";
import { patternsToDefs } from "./patternDefs";

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
  const filterAttr = resolveFilterRef(style.filter);
  if (filterAttr) {
    attrs.push(`filter="${escapeAttr(filterAttr)}"`);
  }
  return attrs.join(" ");
}

function nodeToSvg(node: SceneNode, scene: Scene): string {
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
    case "group": {
      const children = node.childIds
        .map((id) => scene.elements[id])
        .filter((child): child is SceneNode => Boolean(child))
        .map((child) => nodeToSvg(child, scene))
        .join("");
      return `<g transform="${transform}">${children}</g>`;
    }
  }
}

function computeExportBounds(scene: Scene, artboardId?: ArtboardId) {
  if (artboardId) {
    const artboard = scene.artboards.find((a) => a.id === artboardId);
    if (artboard) return artboard;
  }
  if (scene.artboards.length === 0) return { x: 0, y: 0, width: 800, height: 600 };
  if (scene.artboards.length === 1) return scene.artboards[0];

  const minX = Math.min(...scene.artboards.map((a) => a.x));
  const minY = Math.min(...scene.artboards.map((a) => a.y));
  const maxX = Math.max(...scene.artboards.map((a) => a.x + a.width));
  const maxY = Math.max(...scene.artboards.map((a) => a.y + a.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Serializes the scene to a standalone, clean SVG document string. `artboardId` crops to a single artboard; omit to export everything. */
export function sceneToSvg(scene: Scene, artboardId?: ArtboardId): string {
  const bounds = computeExportBounds(scene, artboardId);
  const defs = gradientsToDefs(scene.gradients) + patternsToDefs(scene.patterns) + filtersToDefs(scene.filters);
  const body = scene.layers
    .filter((layer) => layer.visible)
    .map((layer) => {
      const shapes = layer.elementIds
        .map((id) => scene.elements[id])
        .filter((node): node is SceneNode => Boolean(node))
        .map((node) => nodeToSvg(node, scene))
        .join("");
      return `<g>${shapes}</g>`;
    })
    .join("");

  const defsBlock = defs ? `<defs>${defs}</defs>` : "";
  const w = safeNumber(bounds.width, 800);
  const h = safeNumber(bounds.height, 600);
  const x = safeNumber(bounds.x);
  const y = safeNumber(bounds.y);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}">${defsBlock}${body}</svg>`;
}
