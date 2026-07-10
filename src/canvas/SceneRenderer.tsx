import { gradientsToDefs } from "../scene/serializer/gradientDefs";
import { useDraftStore } from "../store/draftStore";
import { useSceneStore } from "../store/sceneStore";
import { Shape } from "./Shape";

/** Renders the real scene as literal SVG DOM — this is the tree that export mirrors. */
export function SceneRenderer() {
  const scene = useSceneStore((s) => s.scene);
  const draftNode = useDraftStore((s) => s.draftNode);

  return (
    <>
      {Object.keys(scene.gradients).length > 0 && (
        <defs dangerouslySetInnerHTML={{ __html: gradientsToDefs(scene.gradients) }} />
      )}
      <rect
        x={0}
        y={0}
        width={scene.artboard.width}
        height={scene.artboard.height}
        fill="white"
        stroke="#94a3b8"
        strokeWidth={1}
      />
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
