use crate::svgopt::clean::clean_svg;
use resvg::tiny_skia;
use resvg::usvg;
use std::fs;
use tauri::command;

#[command]
pub fn export_svg(svg: String, path: String) -> Result<(), String> {
    let cleaned = clean_svg(&svg);
    fs::write(&path, cleaned).map_err(|e| e.to_string())
}

#[command]
pub fn export_png(svg: String, path: String, width: u32, height: u32) -> Result<(), String> {
    let cleaned = clean_svg(&svg);

    let opt = usvg::Options::default();
    let tree = usvg::Tree::from_str(&cleaned, &opt).map_err(|e| e.to_string())?;

    let size = tree.size();
    let scale_x = width as f32 / size.width();
    let scale_y = height as f32 / size.height();

    let mut pixmap =
        tiny_skia::Pixmap::new(width, height).ok_or("failed to allocate output pixmap")?;
    let transform = tiny_skia::Transform::from_scale(scale_x, scale_y);
    resvg::render(&tree, transform, &mut pixmap.as_mut());

    pixmap.save_png(&path).map_err(|e| e.to_string())
}
