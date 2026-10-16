use tauri::command;

#[command]
#[specta::specta]
pub fn is_flatpak() -> bool {
    std::env::var("FLATPAK_ID").is_ok()
}
