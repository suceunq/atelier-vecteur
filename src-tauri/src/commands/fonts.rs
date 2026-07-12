use resvg::tiny_skia;
use resvg::usvg;
use serde::Serialize;
use std::sync::Arc;
use tauri::command;

fn escape_xml(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

#[derive(Serialize)]
pub struct AnchorDto {
    anchor: (f32, f32),
    #[serde(rename = "handleIn")]
    handle_in: Option<(f32, f32)>,
    #[serde(rename = "handleOut")]
    handle_out: Option<(f32, f32)>,
}

#[derive(Serialize)]
pub struct SubpathDto {
    nodes: Vec<AnchorDto>,
    closed: bool,
}

/// Converts one tiny_skia path (in absolute coordinates) into our anchor/handle subpath model.
/// QuadTo control points are converted to the equivalent cubic (`cp = p0 + 2/3*(q-p0)`,
/// `cp = p1 + 2/3*(q-p1)`) since our PathAnchor model only stores cubic handles.
fn path_to_subpaths(path: &tiny_skia::Path) -> Vec<SubpathDto> {
    let mut subpaths: Vec<SubpathDto> = Vec::new();
    let mut current: Vec<AnchorDto> = Vec::new();
    let mut current_point = (0.0f32, 0.0f32);
    let mut start_point = (0.0f32, 0.0f32);

    let finish = |current: &mut Vec<AnchorDto>, subpaths: &mut Vec<SubpathDto>, closed: bool| {
        if !current.is_empty() {
            subpaths.push(SubpathDto {
                nodes: std::mem::take(current),
                closed,
            });
        }
    };

    for segment in path.segments() {
        match segment {
            tiny_skia::PathSegment::MoveTo(p) => {
                finish(&mut current, &mut subpaths, false);
                current_point = (p.x, p.y);
                start_point = current_point;
                current.push(AnchorDto {
                    anchor: current_point,
                    handle_in: None,
                    handle_out: None,
                });
            }
            tiny_skia::PathSegment::LineTo(p) => {
                current.push(AnchorDto {
                    anchor: (p.x, p.y),
                    handle_in: None,
                    handle_out: None,
                });
                current_point = (p.x, p.y);
            }
            tiny_skia::PathSegment::QuadTo(q, p) => {
                let cp1 = (
                    current_point.0 + 2.0 / 3.0 * (q.x - current_point.0),
                    current_point.1 + 2.0 / 3.0 * (q.y - current_point.1),
                );
                let cp2 = (p.x + 2.0 / 3.0 * (q.x - p.x), p.y + 2.0 / 3.0 * (q.y - p.y));
                if let Some(last) = current.last_mut() {
                    last.handle_out = Some((cp1.0 - current_point.0, cp1.1 - current_point.1));
                }
                current.push(AnchorDto {
                    anchor: (p.x, p.y),
                    handle_in: Some((cp2.0 - p.x, cp2.1 - p.y)),
                    handle_out: None,
                });
                current_point = (p.x, p.y);
            }
            tiny_skia::PathSegment::CubicTo(c1, c2, p) => {
                if let Some(last) = current.last_mut() {
                    last.handle_out = Some((c1.x - current_point.0, c1.y - current_point.1));
                }
                current.push(AnchorDto {
                    anchor: (p.x, p.y),
                    handle_in: Some((c2.x - p.x, c2.y - p.y)),
                    handle_out: None,
                });
                current_point = (p.x, p.y);
            }
            tiny_skia::PathSegment::Close => {
                // If the close point coincides with the first anchor, drop the duplicate
                // endpoint our model doesn't need (the subpath's `closed: true` already implies
                // the segment back to the start).
                if let Some(last) = current.last() {
                    let dx = last.anchor.0 - start_point.0;
                    let dy = last.anchor.1 - start_point.1;
                    if dx.abs() < 0.001 && dy.abs() < 0.001 && current.len() > 1 {
                        current.pop();
                    }
                }
                finish(&mut current, &mut subpaths, true);
                current_point = start_point;
            }
        }
    }
    finish(&mut current, &mut subpaths, false);
    subpaths
}

fn collect_paths(group: &usvg::Group, out: &mut Vec<SubpathDto>) {
    for child in group.children() {
        match child {
            usvg::Node::Path(path) => out.extend(path_to_subpaths(path.data())),
            usvg::Node::Group(nested) => collect_paths(nested, out),
            _ => {}
        }
    }
}

/// Renders `text` through usvg's normal text-layout/flattening pass (the same resolution step
/// resvg relies on to rasterize text — it has no font-rendering code of its own, so by the time a
/// tree is handed to it, text has already become path geometry) and returns the resulting
/// subpaths in our own anchor/handle model, in the same local coordinate space (font-size units,
/// baseline at y=0) the TextNode itself uses.
#[command]
pub fn text_to_path(
    content: String,
    font_family: String,
    font_size: f32,
    font_weight: u32,
    text_anchor: String,
) -> Result<Vec<SubpathDto>, String> {
    let mut fontdb = usvg::fontdb::Database::new();
    fontdb.load_system_fonts();

    let safe_anchor = match text_anchor.as_str() {
        "middle" | "end" => text_anchor.as_str(),
        _ => "start",
    };

    let svg = format!(
        r#"<svg xmlns="http://www.w3.org/2000/svg" width="8000" height="4000">
<text x="0" y="0" font-family="{}" font-size="{}" font-weight="{}" text-anchor="{}">{}</text>
</svg>"#,
        escape_xml(&font_family),
        font_size,
        font_weight,
        safe_anchor,
        escape_xml(&content)
    );

    let options = usvg::Options {
        fontdb: Arc::new(fontdb),
        ..Default::default()
    };

    let tree = usvg::Tree::from_str(&svg, &options).map_err(|e| e.to_string())?;

    let mut subpaths = Vec::new();
    collect_paths(tree.root(), &mut subpaths);

    if subpaths.is_empty() {
        return Err(
            "Conversion en tracé indisponible : aucun contour produit pour cette police/ce texte."
                .to_string(),
        );
    }

    Ok(subpaths)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn converts_a_single_closed_square_into_one_subpath() {
        let mut pb = tiny_skia::PathBuilder::new();
        pb.move_to(0.0, 0.0);
        pb.line_to(10.0, 0.0);
        pb.line_to(10.0, 10.0);
        pb.line_to(0.0, 10.0);
        pb.close();
        let path = pb.finish().unwrap();

        let subpaths = path_to_subpaths(&path);
        assert_eq!(subpaths.len(), 1);
        assert!(subpaths[0].closed);
        assert_eq!(subpaths[0].nodes.len(), 4);
        assert_eq!(subpaths[0].nodes[0].anchor, (0.0, 0.0));
    }

    /// Regression coverage for the whole point of the multi-subpath refactor: a letter with a
    /// hole (like "o") is an outer ring + an inner ring — two independent closed subpaths.
    #[test]
    fn converts_two_closed_contours_into_two_subpaths_like_the_letter_o() {
        let mut pb = tiny_skia::PathBuilder::new();
        pb.move_to(0.0, 0.0);
        pb.line_to(20.0, 0.0);
        pb.line_to(20.0, 20.0);
        pb.line_to(0.0, 20.0);
        pb.close();
        pb.move_to(5.0, 5.0);
        pb.line_to(15.0, 5.0);
        pb.line_to(15.0, 15.0);
        pb.line_to(5.0, 15.0);
        pb.close();
        let path = pb.finish().unwrap();

        let subpaths = path_to_subpaths(&path);
        assert_eq!(subpaths.len(), 2);
        assert!(subpaths[0].closed);
        assert!(subpaths[1].closed);
        assert_eq!(subpaths[1].nodes[0].anchor, (5.0, 5.0));
    }

    #[test]
    fn converts_a_cubic_curve_into_bezier_handles() {
        let mut pb = tiny_skia::PathBuilder::new();
        pb.move_to(0.0, 0.0);
        pb.cubic_to(0.0, 10.0, 10.0, 10.0, 10.0, 0.0);
        let path = pb.finish().unwrap();

        let subpaths = path_to_subpaths(&path);
        assert_eq!(subpaths.len(), 1);
        assert_eq!(subpaths[0].nodes.len(), 2);
        assert_eq!(subpaths[0].nodes[0].handle_out, Some((0.0, 10.0)));
        assert_eq!(subpaths[0].nodes[1].handle_in, Some((0.0, 10.0)));
    }
}
