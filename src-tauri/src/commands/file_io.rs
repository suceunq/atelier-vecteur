use crate::project::schema::{LoadedProject, ProjectManifest};
use std::fs::File;
use std::io::{Read, Write};
use tauri::command;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

#[command]
pub fn save_project(path: String, scene: serde_json::Value) -> Result<(), String> {
    let file = File::create(&path).map_err(|e| e.to_string())?;
    let mut zip = ZipWriter::new(file);
    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    let manifest = ProjectManifest::default();

    zip.start_file("manifest.json", options)
        .map_err(|e| e.to_string())?;
    zip.write_all(
        serde_json::to_string_pretty(&manifest)
            .map_err(|e| e.to_string())?
            .as_bytes(),
    )
    .map_err(|e| e.to_string())?;

    zip.start_file("scene.json", options)
        .map_err(|e| e.to_string())?;
    zip.write_all(
        serde_json::to_string_pretty(&scene)
            .map_err(|e| e.to_string())?
            .as_bytes(),
    )
    .map_err(|e| e.to_string())?;

    zip.finish().map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub fn load_project(path: String) -> Result<LoadedProject, String> {
    let file = File::open(&path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

    let manifest: ProjectManifest = {
        let mut f = archive
            .by_name("manifest.json")
            .map_err(|e| e.to_string())?;
        let mut s = String::new();
        f.read_to_string(&mut s).map_err(|e| e.to_string())?;
        serde_json::from_str(&s).map_err(|e| e.to_string())?
    };

    let scene: serde_json::Value = {
        let mut f = archive.by_name("scene.json").map_err(|e| e.to_string())?;
        let mut s = String::new();
        f.read_to_string(&mut s).map_err(|e| e.to_string())?;
        serde_json::from_str(&s).map_err(|e| e.to_string())?
    };

    Ok(LoadedProject { manifest, scene })
}
