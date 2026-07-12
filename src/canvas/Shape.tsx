import type { SVGAttributes } from "react";
import { pathToD } from "../scene/bezier";
import { svgTransformString } from "../scene/geometry";
import { sanitizeImageHref } from "../scene/imageHref";
import { resolveFilterRef, resolvePaint, type SceneNode, type Style } from "../scene/types";
import { useSceneStore } from "../store/sceneStore";

function styleProps(style: Style): SVGAttributes<SVGElement> {
  return {
    fill: resolvePaint(style.fill),
    fillOpacity: style.fillOpacity,
    stroke: resolvePaint(style.stroke),
    strokeWidth: style.strokeWidth,
    strokeOpacity: style.strokeOpacity,
    strokeDasharray: style.strokeDasharray ?? undefined,
    opacity: style.opacity,
    filter: resolveFilterRef(style.filter),
    fillRule: style.fillRule === "evenodd" ? "evenodd" : undefined,
  };
}

interface ShapeProps {
  node: SceneNode;
  interactive: boolean;
}

/** Renders one scene node as its literal SVG element — this DOM structure is what gets exported. */
export function Shape({ node, interactive }: ShapeProps) {
  const elements = useSceneStore((s) => s.scene.elements);
  const transform = svgTransformString(node);
  const style = styleProps(node.style);
  const dataProps = interactive ? { "data-element-id": node.id } : {};

  switch (node.type) {
    case "rect":
      return (
        <rect
          width={node.width}
          height={node.height}
          rx={node.rx || undefined}
          ry={node.ry || undefined}
          transform={transform}
          {...style}
          {...dataProps}
        />
      );
    case "ellipse":
      return (
        <ellipse cx={0} cy={0} rx={node.rx} ry={node.ry} transform={transform} {...style} {...dataProps} />
      );
    case "line":
      return (
        <line x1={0} y1={0} x2={node.x2} y2={node.y2} transform={transform} {...style} {...dataProps} />
      );
    case "polygon": {
      const points = node.points.map((p) => `${p.x},${p.y}`).join(" ");
      return <polygon points={points} transform={transform} {...style} {...dataProps} />;
    }
    case "path":
      return <path d={pathToD(node)} transform={transform} {...style} {...dataProps} />;
    case "text":
      return (
        <text
          x={0}
          y={0}
          transform={transform}
          fontFamily={node.fontFamily}
          fontSize={node.fontSize}
          fontWeight={node.fontWeight}
          textAnchor={node.textAnchor}
          {...style}
          {...dataProps}
        >
          {node.content}
        </text>
      );
    case "group":
      return (
        <g transform={transform} {...dataProps}>
          {node.childIds.map((childId) => {
            const child = elements[childId];
            return child ? <Shape key={childId} node={child} interactive={interactive} /> : null;
          })}
        </g>
      );
    case "image":
      return (
        <image
          href={sanitizeImageHref(node.href)}
          width={node.width}
          height={node.height}
          transform={transform}
          preserveAspectRatio="none"
          opacity={node.style.opacity}
          filter={resolveFilterRef(node.style.filter)}
          {...dataProps}
        />
      );
  }
}
