use std::borrow::Cow;
use std::collections::hash_map::DefaultHasher;
use std::fs;
use std::hash::{Hash, Hasher};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use lofty::picture::{Picture, PictureType};
use lofty::prelude::*;
use rayon::prelude::*;
use serde::Serialize;
use specta::Type;
use tauri::{AppHandle, Manager};

pub const AUDIO_EXTENSIONS: &[&str] = &[
    "mp3", "mp4", "m4a", "aac", "flac", "wav", "ogg", "oga", "opus", "webm",
];

const IMAGE_EXTENSIONS: &[&str] = &["jpg", "jpeg", "png", "webp", "gif", "bmp"];

const PREFERRED_COVER_NAMES: &[&str] = &["cover", "capa", "folder", "front", "album", "artwork"];

const COVERS_DIR: &str = "covers";

const EMBEDDED_COVERS_DIR: &str = "embedded";

const DEFAULT_COVER_EXTENSION: &str = "jpg";

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct LocalAudioFile {
    pub path: String,
    pub file_name: String,
    pub extension: String,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct LocalFolderScan {
    pub folder_path: String,
    pub folder_name: String,
    pub files: Vec<LocalAudioFile>,
    pub cover_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct LocalAudioTags {
    pub path: String,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub track_number: Option<u32>,
    pub duration_ms: Option<u32>,
    pub cover_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MusicFolderSelection {
    pub is_library: bool,
    pub folders: Vec<String>,
}

fn lowercase_extension(path: &Path) -> Option<String> {
    path.extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| extension.to_ascii_lowercase())
}

pub fn is_audio_path(path: &Path) -> bool {
    lowercase_extension(path)
        .map(|extension| AUDIO_EXTENSIONS.contains(&extension.as_str()))
        .unwrap_or(false)
}

fn is_image_path(path: &Path) -> bool {
    lowercase_extension(path)
        .map(|extension| IMAGE_EXTENSIONS.contains(&extension.as_str()))
        .unwrap_or(false)
}

fn sorted_entries(directory: &Path) -> Vec<PathBuf> {
    let mut entries: Vec<PathBuf> = match fs::read_dir(directory) {
        Ok(read_dir) => read_dir.filter_map(|entry| entry.ok().map(|entry| entry.path())).collect(),
        Err(err) => {
            log::warn!("[LocalLibrary] Could not read {}: {err}", directory.display());
            Vec::new()
        }
    };
    entries.sort_by_key(|path| path.to_string_lossy().to_lowercase());
    entries
}

fn collect_audio_files(directory: &Path, files: &mut Vec<LocalAudioFile>) {
    for path in sorted_entries(directory) {
        if path.is_dir() {
            collect_audio_files(&path, files);
        } else if is_audio_path(&path) {
            files.push(LocalAudioFile {
                path: path.to_string_lossy().to_string(),
                file_name: path
                    .file_stem()
                    .map(|stem| stem.to_string_lossy().to_string())
                    .unwrap_or_default(),
                extension: lowercase_extension(&path).unwrap_or_default(),
            });
        }
    }
}

fn find_cover(directory: &Path) -> Option<PathBuf> {
    let images: Vec<PathBuf> = sorted_entries(directory)
        .into_iter()
        .filter(|path| path.is_file() && is_image_path(path))
        .collect();

    let preferred = images.iter().find(|path| {
        path.file_stem()
            .map(|stem| stem.to_string_lossy().to_lowercase())
            .map(|stem| PREFERRED_COVER_NAMES.contains(&stem.as_str()))
            .unwrap_or(false)
    });

    preferred.or_else(|| images.first()).cloned()
}

fn contains_audio(directory: &Path) -> bool {
    sorted_entries(directory).iter().any(|path| {
        (path.is_file() && is_audio_path(path)) || (path.is_dir() && contains_audio(path))
    })
}

fn has_direct_audio(directory: &Path) -> bool {
    sorted_entries(directory)
        .iter()
        .any(|path| path.is_file() && is_audio_path(path))
}

pub fn resolve_folders(folder: &Path) -> Result<MusicFolderSelection, String> {
    if !folder.is_dir() {
        return Err(format!("Not a folder: {}", folder.display()));
    }

    if has_direct_audio(folder) {
        return Ok(MusicFolderSelection {
            is_library: false,
            folders: vec![folder.to_string_lossy().to_string()],
        });
    }

    let folders: Vec<String> = sorted_entries(folder)
        .into_iter()
        .filter(|path| path.is_dir() && contains_audio(path))
        .map(|path| path.to_string_lossy().to_string())
        .collect();

    Ok(MusicFolderSelection {
        is_library: true,
        folders,
    })
}

fn non_empty(value: Option<Cow<'_, str>>) -> Option<String> {
    value
        .map(|text| text.trim().to_string())
        .filter(|text| !text.is_empty())
}

fn save_embedded_cover(picture: &Picture, covers_dir: &Path) -> Option<String> {
    let data = picture.data();
    if data.is_empty() {
        return None;
    }

    let mut hasher = DefaultHasher::new();
    data.hash(&mut hasher);
    let extension = picture
        .mime_type()
        .and_then(|mime_type| mime_type.ext())
        .unwrap_or(DEFAULT_COVER_EXTENSION);
    let destination = covers_dir.join(format!("{:016x}.{extension}", hasher.finish()));

    if !destination.exists() {
        if let Err(err) = fs::write(&destination, data) {
            log::warn!("[LocalLibrary] Could not save embedded cover: {err}");
            return None;
        }
    }

    Some(destination.to_string_lossy().to_string())
}

pub fn read_tags(path: &Path, covers_dir: &Path) -> LocalAudioTags {
    let mut tags = LocalAudioTags {
        path: path.to_string_lossy().to_string(),
        title: None,
        artist: None,
        track_number: None,
        duration_ms: None,
        cover_path: None,
    };

    let tagged_file = match lofty::read_from_path(path) {
        Ok(tagged_file) => tagged_file,
        Err(err) => {
            log::debug!("[LocalLibrary] No tags for {}: {err}", path.display());
            return tags;
        }
    };

    let duration = tagged_file.properties().duration();
    if !duration.is_zero() {
        tags.duration_ms = u32::try_from(duration.as_millis()).ok();
    }

    let Some(tag) = tagged_file.primary_tag().or_else(|| tagged_file.first_tag()) else {
        return tags;
    };

    tags.title = non_empty(tag.title());
    tags.artist = non_empty(tag.artist());
    tags.track_number = tag.track();

    let pictures = tag.pictures();
    tags.cover_path = pictures
        .iter()
        .find(|picture| picture.pic_type() == PictureType::CoverFront)
        .or_else(|| pictures.first())
        .and_then(|picture| save_embedded_cover(picture, covers_dir));

    tags
}

pub fn scan_folder(folder: &Path) -> Result<LocalFolderScan, String> {
    if !folder.is_dir() {
        return Err(format!("Not a folder: {}", folder.display()));
    }

    let mut files = Vec::new();
    collect_audio_files(folder, &mut files);

    Ok(LocalFolderScan {
        folder_path: folder.to_string_lossy().to_string(),
        folder_name: folder
            .file_name()
            .map(|name| name.to_string_lossy().to_string())
            .unwrap_or_else(|| folder.to_string_lossy().to_string()),
        files,
        cover_path: find_cover(folder).map(|path| path.to_string_lossy().to_string()),
    })
}

#[tauri::command]
#[specta::specta]
pub fn scan_music_folder(path: String) -> Result<LocalFolderScan, String> {
    let scan = scan_folder(Path::new(&path))?;
    log::info!(
        "[LocalLibrary] Scanned {} ({} audio files)",
        scan.folder_path,
        scan.files.len()
    );
    Ok(scan)
}

#[tauri::command]
#[specta::specta]
pub fn resolve_music_folders(path: String) -> Result<MusicFolderSelection, String> {
    resolve_folders(Path::new(&path))
}

#[tauri::command]
#[specta::specta]
pub async fn read_audio_tags(
    app: AppHandle,
    paths: Vec<String>,
) -> Result<Vec<LocalAudioTags>, String> {
    let covers_dir = app
        .path()
        .app_data_dir()
        .map_err(|err| err.to_string())?
        .join(COVERS_DIR)
        .join(EMBEDDED_COVERS_DIR);

    tauri::async_runtime::spawn_blocking(move || {
        fs::create_dir_all(&covers_dir).map_err(|err| err.to_string())?;
        Ok(paths
            .par_iter()
            .map(|path| read_tags(Path::new(path), &covers_dir))
            .collect())
    })
    .await
    .map_err(|err| err.to_string())?
}

#[tauri::command]
#[specta::specta]
pub fn save_playlist_cover(
    app: AppHandle,
    playlist_id: String,
    source_path: String,
) -> Result<String, String> {
    let source = Path::new(&source_path);
    if !is_image_path(source) {
        return Err("Unsupported image format".to_string());
    }

    let covers_dir = app
        .path()
        .app_data_dir()
        .map_err(|err| err.to_string())?
        .join(COVERS_DIR);
    fs::create_dir_all(&covers_dir).map_err(|err| err.to_string())?;

    let prefix = format!("{playlist_id}-");
    for existing in sorted_entries(&covers_dir) {
        let is_previous_cover = existing
            .file_name()
            .map(|name| name.to_string_lossy().starts_with(&prefix))
            .unwrap_or(false);
        if is_previous_cover {
            let _ = fs::remove_file(existing);
        }
    }

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or_default();
    let extension = lowercase_extension(source).unwrap_or_default();
    let destination = covers_dir.join(format!("{prefix}{timestamp}.{extension}"));

    fs::copy(source, &destination).map_err(|err| err.to_string())?;
    Ok(destination.to_string_lossy().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn touch(path: &Path) {
        fs::write(path, b"").unwrap();
    }

    #[test]
    fn scans_audio_files_recursively_in_alphabetical_order() {
        let folder = tempfile::tempdir().unwrap();
        touch(&folder.path().join("B - Second.mp3"));
        touch(&folder.path().join("A - First.FLAC"));
        touch(&folder.path().join("notes.txt"));
        fs::create_dir(folder.path().join("disc 2")).unwrap();
        touch(&folder.path().join("disc 2").join("C - Third.m4a"));

        let scan = scan_folder(folder.path()).unwrap();
        let names: Vec<&str> = scan.files.iter().map(|file| file.file_name.as_str()).collect();

        assert_eq!(names, vec!["A - First", "B - Second", "C - Third"]);
        assert_eq!(scan.files[0].extension, "flac");
    }

    #[test]
    fn prefers_conventionally_named_cover_images() {
        let folder = tempfile::tempdir().unwrap();
        touch(&folder.path().join("aaa.png"));
        touch(&folder.path().join("Capa.jpg"));

        let scan = scan_folder(folder.path()).unwrap();

        assert!(scan.cover_path.unwrap().ends_with("Capa.jpg"));
    }

    #[test]
    fn falls_back_to_any_image_as_cover() {
        let folder = tempfile::tempdir().unwrap();
        touch(&folder.path().join("random.webp"));

        let scan = scan_folder(folder.path()).unwrap();

        assert!(scan.cover_path.unwrap().ends_with("random.webp"));
    }

    #[test]
    fn treats_a_folder_with_music_as_a_single_playlist() {
        let folder = tempfile::tempdir().unwrap();
        touch(&folder.path().join("A - Song.mp3"));
        fs::create_dir(folder.path().join("bonus")).unwrap();
        touch(&folder.path().join("bonus").join("B - Extra.mp3"));

        let selection = resolve_folders(folder.path()).unwrap();

        assert!(!selection.is_library);
        assert_eq!(selection.folders.len(), 1);
    }

    #[test]
    fn treats_each_subfolder_with_music_as_a_playlist() {
        let folder = tempfile::tempdir().unwrap();
        touch(&folder.path().join("controle.txt"));
        for name in ["Mix - Save Me", "Mix - Tarzan Boy", "Empty"] {
            fs::create_dir(folder.path().join(name)).unwrap();
        }
        touch(&folder.path().join("Mix - Save Me").join("A - Song.mp3"));
        let disc = folder.path().join("Mix - Tarzan Boy").join("disc 1");
        fs::create_dir(&disc).unwrap();
        touch(&disc.join("B - Song.flac"));

        let selection = resolve_folders(folder.path()).unwrap();
        let names: Vec<String> = selection
            .folders
            .iter()
            .map(|path| Path::new(path).file_name().unwrap().to_string_lossy().to_string())
            .collect();

        assert!(selection.is_library);
        assert_eq!(names, vec!["Mix - Save Me", "Mix - Tarzan Boy"]);
    }

    #[test]
    fn returns_empty_tags_for_unreadable_audio() {
        let folder = tempfile::tempdir().unwrap();
        let file = folder.path().join("broken.mp3");
        fs::write(&file, b"not really audio").unwrap();

        let tags = read_tags(&file, folder.path());

        assert_eq!(tags.title, None);
        assert_eq!(tags.cover_path, None);
    }

    #[test]
    fn stores_identical_embedded_covers_once() {
        let folder = tempfile::tempdir().unwrap();
        let picture = Picture::new_unchecked(
            PictureType::CoverFront,
            Some(lofty::picture::MimeType::Png),
            None,
            vec![1, 2, 3],
        );

        let first = save_embedded_cover(&picture, folder.path()).unwrap();
        let second = save_embedded_cover(&picture, folder.path()).unwrap();

        assert_eq!(first, second);
        assert!(first.ends_with(".png"));
        assert_eq!(fs::read_dir(folder.path()).unwrap().count(), 1);
    }

    #[test]
    fn rejects_paths_that_are_not_folders() {
        let folder = tempfile::tempdir().unwrap();
        let file = folder.path().join("song.mp3");
        touch(&file);

        assert!(scan_folder(&file).is_err());
    }
}
