import { filtersToDefs } from "../scene/serializer/filterDefs";
import { gradientsToDefs } from "../scene/serializer/gradientDefs";
import { patternsToDefs } from "../scene/serializer/patternDefs";
import { useDraftStore } from "../store/draftStore";
import { useSceneStore } from "../store/sceneStore";
import { Shape } from "./Shape";

/** Renders the real scene as literal SVG DOM — this is the tree that export mirrors. */
export function SceneRenderer() {
  const scene = useSceneStore((s) => s.scene);
  const draftNode = useDraftStore((s) => s.draftNode);

  const defs =
    gradientsToDefs(scene.gradients) + patternsToDefs(scene.patterns) + filtersToDefs(scene.filters);

  return (
    <>
      {defs && <defs dangerouslySetInnerHTML={{ __html: defs }} />}
      {scene.artboards.map((artboard) => (
        <g key={artboard.id}>
          <text x={artboard.x} y={artboard.y - 6} fontSize={11} fill="#64748b">
            {artboard.name}
          </text>
          <rect
            x={artboard.x}
            y={artboard.y}
            width={artboard.width}
            height={artboard.height}
            fill="white"
            stroke="#94a3b8"
            strokeWidth={1}
          />
        </g>
      ))}
      {scene.layers
        .filter((layer) => layer.visible)
        .map((layer) => (
          <g key={layer.id} opacity={layer.locked ? 0.85 : 1}>
            {layer.elementIds.map((id) => {
              const node = scene.elements[id];
              return node ? <Shape key={id} node={node} interactive={!layer.locked} /> : null;
            })}
          </g>
        ))}
      {draftNode && (
        <g opacity={0.8}>
          <Shape node={draftNode} interactive={false} />
        </g>
      )}
    </>
  );
}
