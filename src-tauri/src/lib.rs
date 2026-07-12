mod commands;
mod project;
mod svgopt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            commands::file_io::save_project,
            commands::file_io::load_project,
            commands::export::export_svg,
            commands::export::export_png,
            commands::fonts::text_to_path,
            commands::images::import_image,
            commands::images::trace_image,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
