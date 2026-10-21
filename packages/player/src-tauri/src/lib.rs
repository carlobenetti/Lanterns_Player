pub mod commands;
pub mod db;
pub mod folder_browser;
pub mod history;
pub mod local_library;
pub mod logging;
pub mod net;
pub mod pagination;
pub mod profile;
mod setup;
pub mod stream_server;

// Maximizes the window when running as a non-steam app in steam
#[cfg(target_os = "linux")]
fn maximize_for_gamescope(app: &tauri::App) {
    use tauri::Manager;

    let is_gamescope = std::env::var("GAMESCOPE_WAYLAND_DISPLAY").is_ok()
        || std::env::var("SteamDeck").map_or(false, |v| v == "1");

    if is_gamescope {
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.maximize();
        }
    }
}

#[cfg(all(debug_assertions, desktop))]
fn typescript_export_config() -> specta_typescript::Typescript {
    specta_typescript::Typescript::default().header("/* eslint-disable */")
}

fn specta_builder() -> tauri_specta::Builder<tauri::Wry> {
    tauri_specta::Builder::<tauri::Wry>::new().commands(tauri_specta::collect_commands![
        commands::is_flatpak,
        logging::get_startup_logs,
        stream_server::stream_server_port,
        local_library::scan_music_folder,
        local_library::save_playlist_cover,
        local_library::resolve_music_folders,
        local_library::read_audio_tags,
        folder_browser::storage_roots,
        folder_browser::list_folder,
        history::commands::history_record_event,
        history::commands::history_fetch,
        history::commands::history_delete_range,
        history::commands::history_hourly_listening_time,
        history::commands::history_daily_listening_time,
        history::commands::history_first_play_at,
        history::commands::history_top_artists,
        history::commands::history_top_albums,
        history::commands::history_top_tracks
    ])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let profile = profile::parse_profile(std::env::args()).unwrap_or_else(|message| {
        eprintln!("{message}");
        std::process::exit(1);
    });

    let mut context: tauri::Context<tauri::Wry> = tauri::generate_context!();
    let default_identifier = context.config().identifier.clone();
    if let Some(name) = &profile {
        context.config_mut().identifier = profile::profile_identifier(&default_identifier, name);
    }

    let specta_builder = specta_builder();

    #[cfg(all(debug_assertions, desktop))]
    specta_builder
        .export(
            typescript_export_config(),
            concat!(
                env!("CARGO_MANIFEST_DIR"),
                "/../src/services/tauri/bindings.ts"
            ),
        )
        .expect("failed to export typescript bindings");

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build());

    #[cfg(desktop)]
    let builder = builder.plugin(
        tauri_plugin_window_state::Builder::default()
            .with_state_flags(
                tauri_plugin_window_state::StateFlags::all()
                    .difference(tauri_plugin_window_state::StateFlags::VISIBLE),
            )
            .build(),
    );

    builder
        .plugin(setup::log_plugin())
        .invoke_handler(specta_builder.invoke_handler())
        .manage(profile::DefaultIdentifier(default_identifier))
        .setup(move |app| {
            if let Some(name) = &profile {
                log::info!("Using profile {name}");
            }
            logging::mark_startup_complete();
            stream_server::init_stream_server(app.handle().clone());
            history::init_history(app.handle().clone());

            #[cfg(target_os = "linux")]
            maximize_for_gamescope(app);

            Ok(())
        })
        .run(context)
        .expect("error while running tauri application");
}
