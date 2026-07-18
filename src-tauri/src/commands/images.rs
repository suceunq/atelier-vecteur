use base64::{engine::general_purpose::STANDARD, Engine as _};
use serde::Deserialize;
use std::fs;
use std::path::Path;
use tauri::command;

/// A picked file could be renamed to look like an image but actually be huge — cap it before
/// decoding, mirroring the zip-entry size guard in `file_io.rs`.
const MAX_IMAGE_BYTES: u64 = 30 * 1024 * 1024;

fn image_mime_for_extension(path: &str) -> Result<&'static str, String> {
    let ext = Path::new(path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    match ext.as_str() {
        "png" => Ok("image/png"),
        "jpg" | "jpeg" => Ok("image/jpeg"),
        "gif" => Ok("image/gif"),
        "webp" => Ok("image/webp"),
        _ => Err("i18n:image.unsupported".to_string()),
    }
}

fn read_capped(path: &str) -> Result<Vec<u8>, String> {
    let metadata = fs::metadata(path).map_err(|e| e.to_string())?;
    if metadata.len() > MAX_IMAGE_BYTES {
        return Err("i18n:image.too_large".to_string());
    }
    fs::read(path).map_err(|e| e.to_string())
}

/// Reads a picked image file and returns it as a `data:` URI for embedding as a raster ImageNode.
#[command]
pub fn import_image(path: String) -> Result<String, String> {
    let mime = image_mime_for_extension(&path)?;
    let bytes = read_capped(&path)?;
    let b64 = STANDARD.encode(&bytes);
    Ok(format!("data:{mime};base64,{b64}"))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TraceOptions {
    color_mode: String,
    hierarchical: String,
    filter_speckle: usize,
    color_precision: i32,
    layer_difference: i32,
    mode: String,
    corner_threshold: i32,
    length_threshold: f64,
    max_iterations: usize,
    splice_threshold: i32,
    path_precision: Option<u32>,
}

impl TraceOptions {
    fn to_config(&self) -> vtracer::Config {
        let mut config = vtracer::Config::default();
        config.color_mode = match self.color_mode.as_str() {
            "binary" => vtracer::ColorMode::Binary,
            _ => vtracer::ColorMode::Color,
        };
        config.hierarchical = match self.hierarchical.as_str() {
            "cutout" => vtracer::Hierarchical::Cutout,
            _ => vtracer::Hierarchical::Stacked,
        };
        config.filter_speckle = self.filter_speckle;
        config.color_precision = self.color_precision;
        config.layer_difference = self.layer_difference;
        config.mode = match self.mode.as_str() {
            "polygon" => visioncortex::PathSimplifyMode::Polygon,
            "none" => visioncortex::PathSimplifyMode::None,
            _ => visioncortex::PathSimplifyMode::Spline,
        };
        config.corner_threshold = self.corner_threshold;
        config.length_threshold = self.length_threshold;
        config.max_iterations = self.max_iterations;
        config.splice_threshold = self.splice_threshold;
        config.path_precision = self.path_precision;
        config
    }
}

/// Tracing cost (vtracer's curve-fitting) grows with pixel count, and a phone-camera photo
/// easily exceeds this before any editing benefit — the result gets scaled down to fit the
/// artboard anyway. Downscaling first keeps a multi-megapixel import from taking minutes.
const MAX_TRACE_DIM: u32 = 1500;

/// A photographic image in full-color mode can legitimately decompose into tens of thousands of
/// tiny same-color regions (a real test photo hit ~20 000 with default settings) — each becomes
/// an editable PathNode and a live SVG DOM element on the frontend. Downscaling the bitmap only
/// controls trace *time*; it does nothing for path *count* on a busy/noisy photo, so the app
/// would still lock up turning 20 000 paths into scene nodes and DOM elements. Reject past this
/// point with an actionable message rather than silently handing the frontend an unusable result.
const MAX_TRACE_PATHS: usize = 20_000;

/// Traces a picked raster image into an SVG string (one `<path>` per color region) via `vtracer`.
/// The caller parses that SVG's `<path>` elements into editable `PathNode`s.
///
/// Runs on a blocking thread: this is CPU-heavy (curve fitting over every pixel), and a plain
/// synchronous `#[command]` would otherwise tie up the same thread pool that services the
/// WebView's IPC/asset requests — from the user's perspective the whole window would stop
/// responding until tracing finished, rather than just the import dialog showing its own
/// "en cours" state.
#[command]
pub async fn trace_image(path: String, options: TraceOptions) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || -> Result<String, String> {
        image_mime_for_extension(&path)?;
        let bytes = read_capped(&path)?;
        let img = image::load_from_memory(&bytes).map_err(|e| e.to_string())?;
        let (width, height) = (img.width(), img.height());
        if width == 0 || height == 0 {
            return Err("i18n:image.empty".to_string());
        }
        let longest = width.max(height);
        let resized = if longest > MAX_TRACE_DIM {
            let scale = MAX_TRACE_DIM as f64 / longest as f64;
            let new_width = ((width as f64) * scale).round().max(1.0) as u32;
            let new_height = ((height as f64) * scale).round().max(1.0) as u32;
            img.resize(new_width, new_height, image::imageops::FilterType::Lanczos3)
        } else {
            img
        };
        let rgba = resized.to_rgba8();
        let (width, height) = rgba.dimensions();
        let mut color_image = vtracer::ColorImage::new_w_h(width as usize, height as usize);
        color_image.pixels = rgba.into_raw();
        let svg = vtracer::convert(color_image, options.to_config())?.to_string();
        let path_count = svg.matches("<path").count();
        if path_count > MAX_TRACE_PATHS {
            return Err(format!("i18n:image.trace_too_complex:{path_count}:{MAX_TRACE_PATHS}"));
        }
        Ok(svg)
    })
    .await
    .map_err(|_| "i18n:image.trace_failed".to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_known_image_extensions() {
        assert_eq!(image_mime_for_extension("photo.PNG").unwrap(), "image/png");
        assert_eq!(image_mime_for_extension("photo.jpeg").unwrap(), "image/jpeg");
        assert_eq!(image_mime_for_extension("photo.webp").unwrap(), "image/webp");
    }

    #[test]
    fn rejects_unknown_extensions() {
        assert!(image_mime_for_extension("payload.svg").is_err());
        assert!(image_mime_for_extension("payload.exe").is_err());
        assert!(image_mime_for_extension("no-extension").is_err());
    }
}
