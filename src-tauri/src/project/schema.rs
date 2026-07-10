use serde::{Deserialize, Serialize};

pub const CURRENT_FORMAT_VERSION: u32 = 1;

#[derive(Serialize, Deserialize)]
pub struct ProjectManifest {
    pub format_version: u32,
    pub app_version: String,
}

impl Default for ProjectManifest {
    fn default() -> Self {
        Self {
            format_version: CURRENT_FORMAT_VERSION,
            app_version: env!("CARGO_PKG_VERSION").to_string(),
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct LoadedProject {
    pub manifest: ProjectManifest,
    pub scene: serde_json::Value,
}
