use std::fs;
use std::path::Path;

use serde::Serialize;
use specta::Type;

use crate::local_library::is_audio_path;

#[cfg(target_os = "android")]
const ANDROID_INTERNAL_STORAGE: &str = "/storage/emulated/0";

#[cfg(target_os = "android")]
const ANDROID_STORAGE_DIR: &str = "/storage";

#[cfg(target_os = "android")]
const ANDROID_VIRTUAL_STORAGE_NAMES: &[&str] = &["emulated", "self"];

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FolderEntry {
    pub path: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FolderListing {
    pub path: String,
    pub name: String,
    pub parent: Option<String>,
    pub folders: Vec<FolderEntry>,
    pub audio_file_count: u32,
}

fn entry_name(path: &Path) -> String {
    path.file_name()
        .map(|name| name.to_string_lossy().to_string())
        .unwrap_or_else(|| path.to_string_lossy().to_string())
}

fn is_hidden(path: &Path) -> bool {
    path.file_name()
        .map(|name| name.to_string_lossy().starts_with('.'))
        .unwrap_or(false)
}

pub fn list_folder_contents(folder: &Path, roots: &[String]) -> Result<FolderListing, String> {
    let read_dir = fs::read_dir(folder).map_err(|err| format!("{}: {err}", folder.display()))?;

    let mut folders = Vec::new();
    let mut audio_file_count = 0;
    for path in read_dir.filter_map(|entry| entry.ok().map(|entry| entry.path())) {
        if is_hidden(&path) {
            continue;
        }
        if path.is_dir() {
            folders.push(FolderEntry {
                name: entry_name(&path),
                path: path.to_string_lossy().to_string(),
            });
        } else if is_audio_path(&path) {
            audio_file_count += 1;
        }
    }
    folders.sort_by_key(|entry| entry.name.to_lowercase());

    let folder_path = folder.to_string_lossy().to_string();
    let is_root = roots.iter().any(|root| root == &folder_path);
    let parent = if is_root {
        None
    } else {
        folder
            .parent()
            .map(|parent| parent.to_string_lossy().to_string())
    };

    Ok(FolderListing {
        name: entry_name(folder),
        path: folder_path,
        parent,
        folders,
        audio_file_count,
    })
}

#[cfg(target_os = "android")]
fn storage_root_entries() -> Vec<FolderEntry> {
    let mut roots = vec![FolderEntry {
        path: ANDROID_INTERNAL_STORAGE.to_string(),
        name: ANDROID_INTERNAL_STORAGE.to_string(),
    }];

    if let Ok(read_dir) = fs::read_dir(ANDROID_STORAGE_DIR) {
        for path in read_dir.filter_map(|entry| entry.ok().map(|entry| entry.path())) {
            let name = entry_name(&path);
            if ANDROID_VIRTUAL_STORAGE_NAMES.contains(&name.as_str()) || !path.is_dir() {
                continue;
            }
            roots.push(FolderEntry {
                path: path.to_string_lossy().to_string(),
                name,
            });
        }
    }

    roots
}

#[cfg(not(target_os = "android"))]
fn storage_root_entries() -> Vec<FolderEntry> {
    Vec::new()
}

#[tauri::command]
#[specta::specta]
pub fn storage_roots() -> Vec<FolderEntry> {
    storage_root_entries()
}

#[tauri::command]
#[specta::specta]
pub fn list_folder(path: String) -> Result<FolderListing, String> {
    let roots: Vec<String> = storage_root_entries()
        .into_iter()
        .map(|root| root.path)
        .collect();
    list_folder_contents(Path::new(&path), &roots)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn touch(path: &Path) {
        fs::write(path, b"").unwrap();
    }

    #[test]
    fn lists_visible_subfolders_alphabetically_and_counts_audio() {
        let folder = tempfile::tempdir().unwrap();
        for name in ["Rock", "ambient", ".thumbnails"] {
            fs::create_dir(folder.path().join(name)).unwrap();
        }
        touch(&folder.path().join("A - Song.mp3"));
        touch(&folder.path().join("B - Song.FLAC"));
        touch(&folder.path().join("notes.txt"));

        let listing = list_folder_contents(folder.path(), &[]).unwrap();
        let names: Vec<&str> = listing
            .folders
            .iter()
            .map(|entry| entry.name.as_str())
            .collect();

        assert_eq!(names, vec!["ambient", "Rock"]);
        assert_eq!(listing.audio_file_count, 2);
        assert!(listing.parent.is_some());
    }

    #[test]
    fn storage_roots_have_no_parent() {
        let folder = tempfile::tempdir().unwrap();
        let root = folder.path().to_string_lossy().to_string();

        let listing = list_folder_contents(folder.path(), &[root]).unwrap();

        assert_eq!(listing.parent, None);
    }

    #[test]
    fn fails_for_missing_folders() {
        let folder = tempfile::tempdir().unwrap();

        assert!(list_folder_contents(&folder.path().join("missing"), &[]).is_err());
    }
}
