use crate::project::schema::{LoadedProject, ProjectManifest};
use std::fs::{self, File};
use std::io::{Read, Write};
use tauri::{command, AppHandle, Manager};
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

/// Caps how much a single zip entry is allowed to decompress to. A `.svgatelier` file is picked
/// by the user via a native file dialog, but nothing stops someone from renaming a crafted zip
/// bomb to that extension and sending it to the user — bound the read so opening one can't
/// exhaust memory.
const MAX_ENTRY_BYTES: u64 = 200 * 1024 * 1024;

fn recovery_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("recovery.json"))
}

#[command]
pub fn save_recovery(app: AppHandle, scene: serde_json::Value) -> Result<(), String> {
    let path = recovery_path(&app)?;
    let temporary = path.with_extension("tmp");
    fs::write(&temporary, serde_json::to_vec(&scene).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;
    fs::rename(temporary, path).map_err(|e| e.to_string())
}

#[command]
pub fn load_recovery(app: AppHandle) -> Result<Option<serde_json::Value>, String> {
    let path = recovery_path(&app)?;
    if !path.exists() {
        return Ok(None);
    }
    let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
    if metadata.len() > MAX_ENTRY_BYTES {
        return Err("La sauvegarde de récupération est trop volumineuse.".to_string());
    }
    let bytes = fs::read(path).map_err(|e| e.to_string())?;
    serde_json::from_slice(&bytes).map(Some).map_err(|e| e.to_string())
}

#[command]
pub fn clear_recovery(app: AppHandle) -> Result<(), String> {
    let path = recovery_path(&app)?;
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn read_entry_to_string<R: Read>(entry: &mut R, name: &str) -> Result<String, String> {
    let mut s = String::new();
    entry
        .take(MAX_ENTRY_BYTES)
        .read_to_string(&mut s)
        .map_err(|e| format!("{name}: {e}"))?;
    Ok(s)
}

#[command]
pub fn save_project(path: String, scene: serde_json::Value) -> Result<(), String> {
    if !path.to_ascii_lowercase().ends_with(".svgatelier") {
        return Err("Le fichier de destination doit avoir l'extension .svgatelier".to_string());
    }
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
        let s = read_entry_to_string(&mut f, "manifest.json")?;
        serde_json::from_str(&s).map_err(|e| e.to_string())?
    };

    let scene: serde_json::Value = {
        let mut f = archive.by_name("scene.json").map_err(|e| e.to_string())?;
        let s = read_entry_to_string(&mut f, "scene.json")?;
        serde_json::from_str(&s).map_err(|e| e.to_string())?
    };

    Ok(LoadedProject { manifest, scene })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_content_under_the_limit_in_full() {
        let data = "hello world";
        let mut cursor = std::io::Cursor::new(data.as_bytes());
        let result = read_entry_to_string(&mut cursor, "test").unwrap();
        assert_eq!(result, data);
    }

    #[test]
    fn truncates_instead_of_exhausting_memory_on_oversized_content() {
        const LIMIT: u64 = 10;
        let data = "this string is much longer than the limit";
        let mut cursor = std::io::Cursor::new(data.as_bytes());
        let mut s = String::new();
        cursor.by_ref().take(LIMIT).read_to_string(&mut s).unwrap();
        assert_eq!(s.len(), LIMIT as usize);
        assert_ne!(s, data);
    }
}
