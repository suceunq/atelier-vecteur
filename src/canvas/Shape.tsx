import type { SVGAttributes } from "react";
import { pathToD } from "../scene/bezier";
import { svgTransformString } from "../scene/geometry";
import { resolvePaint, type SceneNode, type Style } from "../scene/types";

function styleProps(style: Style): SVGAttributes<SVGElement> {
  return {
    fill: resolvePaint(style.fill),
    fillOpacity: style.fillOpacity,
    stroke: resolvePaint(style.stroke),
    strokeWidth: style.strokeWidth,
    strokeOpacity: style.strokeOpacity,
    strokeDasharray: style.strokeDasharray ?? undefined,
    opacity: style.opacity,
  };
}

interface ShapeProps {
  node: SceneNode;
  interactive: boolean;
}

/** Renders one scene node as its literal SVG element — this DOM structure is what gets exported. */
export function Shape({ node, interactive }: ShapeProps) {
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
  }
}
