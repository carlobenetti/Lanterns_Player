import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';

import type {
  Playlist,
  PlaylistIndexEntry,
  PlaylistItem,
  Track,
} from '@nuclearplayer/model';
import { stripResolutionState } from '@nuclearplayer/model';

import { libraryRoots } from '../services/libraryRoots';
import {
  folderOrigin,
  isFolderPlaylist,
  localCoverArtwork,
  readAudioTags,
  resolveMusicFolders,
  saveCoverImage,
  scanMusicFolder,
  trackFromLocalFile,
} from '../services/localFolders';
import { Logger } from '../services/logger';
import { playlistFileService } from '../services/playlistFileService';
import { useQueueStore } from './queueStore';

type PlaylistStore = {
  index: PlaylistIndexEntry[];
  playlists: Map<string, Playlist>;
  loaded: boolean;
  isSyncingLibrary: boolean;

  loadIndex: () => Promise<void>;
  loadPlaylist: (id: string) => Promise<Playlist | null>;
  createPlaylist: (name: string) => Promise<string>;
  deletePlaylist: (id: string) => Promise<void>;
  addTracks: (playlistId: string, tracks: Track[]) => Promise<PlaylistItem[]>;
  removeTracks: (playlistId: string, itemIds: string[]) => Promise<void>;
  importPlaylist: (playlist: Playlist) => Promise<string>;
  saveQueueAsPlaylist: (name: string) => Promise<string>;
  addMusicFolder: (folderPath: string) => Promise<string[]>;
  addFolderPlaylist: (folderPath: string) => Promise<string>;
  syncLibraryRoots: () => Promise<void>;
  syncFolderPlaylist: (id: string) => Promise<void>;
  setPlaylistCover: (id: string, imagePath: string) => Promise<void>;
  reorderTracks: (
    playlistId: string,
    from: number,
    to: number,
  ) => Promise<void>;
  updatePlaylist: (
    id: string,
    updates: Partial<
      Pick<Playlist, 'name' | 'description' | 'tags' | 'artwork'>
    >,
  ) => Promise<void>;
};

export const usePlaylistStore = create<PlaylistStore>((set, get) => ({
  index: [],
  playlists: new Map(),
  loaded: false,
  isSyncingLibrary: false,

  loadIndex: async () => {
    const index = await playlistFileService.loadIndex();
    set({ index, loaded: true });
  },

  loadPlaylist: async (id: string) => {
    const cached = get().playlists.get(id);
    if (cached) {
      return cached;
    }

    const playlist = await playlistFileService.loadPlaylist(id);
    if (playlist) {
      set((state) => ({
        playlists: new Map(state.playlists).set(id, playlist),
      }));
    }
    return playlist;
  },

  createPlaylist: async (name: string) => {
    const now = new Date().toISOString();
    const playlist: Playlist = {
      id: uuidv4(),
      name,
      createdAtIso: now,
      lastModifiedIso: now,
      isReadOnly: false,
      items: [],
    };

    const index = await playlistFileService.savePlaylist(playlist);

    set((state) => ({
      playlists: new Map(state.playlists).set(playlist.id, playlist),
      index,
    }));

    return playlist.id;
  },

  importPlaylist: async (playlist: Playlist) => {
    const now = new Date().toISOString();
    const imported: Playlist = {
      ...playlist,
      id: uuidv4(),
      createdAtIso: now,
      lastModifiedIso: now,
      isReadOnly: false,
    };

    const index = await playlistFileService.savePlaylist(imported);

    set((state) => ({
      playlists: new Map(state.playlists).set(imported.id, imported),
      index,
    }));

    return imported.id;
  },

  addTracks: async (playlistId: string, tracks: Track[]) => {
    const playlist = await get().loadPlaylist(playlistId);
    if (!playlist) {
      throw new Error(`Playlist ${playlistId} not found`);
    }

    const now = new Date().toISOString();
    const newItems: PlaylistItem[] = tracks.map((track) => ({
      id: uuidv4(),
      track,
      addedAtIso: now,
    }));

    const updated: Playlist = {
      ...playlist,
      items: [...playlist.items, ...newItems],
      lastModifiedIso: now,
    };

    const index = await playlistFileService.savePlaylist(updated);

    set((state) => ({
      playlists: new Map(state.playlists).set(playlistId, updated),
      index,
    }));

    return newItems;
  },

  removeTracks: async (playlistId: string, itemIds: string[]) => {
    const playlist = await get().loadPlaylist(playlistId);
    if (!playlist) {
      return;
    }

    const idsToRemove = new Set(itemIds);
    const updated: Playlist = {
      ...playlist,
      items: playlist.items.filter((item) => !idsToRemove.has(item.id)),
      lastModifiedIso: new Date().toISOString(),
    };

    const index = await playlistFileService.savePlaylist(updated);

    set((state) => ({
      playlists: new Map(state.playlists).set(playlistId, updated),
      index,
    }));
  },

  reorderTracks: async (playlistId: string, from: number, to: number) => {
    const playlist = get().playlists.get(playlistId);
    if (!playlist) {
      return;
    }

    const items = [...playlist.items];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);

    const updated: Playlist = {
      ...playlist,
      items,
      lastModifiedIso: new Date().toISOString(),
    };

    set((state) => ({
      playlists: new Map(state.playlists).set(playlistId, updated),
    }));

    const index = await playlistFileService.savePlaylist(updated);
    set({ index });
  },

  saveQueueAsPlaylist: async (name: string) => {
    const tracks = useQueueStore
      .getState()
      .items.map((item) => stripResolutionState(item.track));
    const now = new Date().toISOString();

    const playlist: Playlist = {
      id: uuidv4(),
      name,
      createdAtIso: now,
      lastModifiedIso: now,
      isReadOnly: false,
      items: tracks.map((track) => ({
        id: uuidv4(),
        track,
        addedAtIso: now,
      })),
    };

    const index = await playlistFileService.savePlaylist(playlist);

    set((state) => ({
      playlists: new Map(state.playlists).set(playlist.id, playlist),
      index,
    }));

    return playlist.id;
  },

  addMusicFolder: async (folderPath: string) => {
    const selection = await resolveMusicFolders(folderPath);
    if (selection.isLibrary) {
      await libraryRoots.add(folderPath);
    }

    const playlistIds: string[] = [];
    for (const folder of selection.folders) {
      playlistIds.push(await get().addFolderPlaylist(folder));
    }
    return playlistIds;
  },

  syncLibraryRoots: async () => {
    const knownFolders = new Set(
      get()
        .index.filter(isFolderPlaylist)
        .map((entry) => entry.origin?.id),
    );

    set({ isSyncingLibrary: true });
    try {
      for (const root of await libraryRoots.list()) {
        try {
          const selection = await resolveMusicFolders(root);
          const newFolders = selection.folders.filter(
            (folder) => !knownFolders.has(folder),
          );
          for (const folder of newFolders) {
            await get().addFolderPlaylist(folder);
            knownFolders.add(folder);
          }
        } catch (error) {
          Logger.playlists.warn(
            `Could not sync music library ${root}: ${String(error)}`,
          );
        }
      }
    } finally {
      set({ isSyncingLibrary: false });
    }
  },

  addFolderPlaylist: async (folderPath: string) => {
    const existing = get().index.find(
      (entry) => isFolderPlaylist(entry) && entry.origin?.id === folderPath,
    );
    if (existing) {
      await get().syncFolderPlaylist(existing.id);
      return existing.id;
    }

    const scan = await scanMusicFolder(folderPath);
    const tagsByPath = await readAudioTags(scan.files.map((file) => file.path));
    const now = new Date().toISOString();
    const playlist: Playlist = {
      id: uuidv4(),
      name: scan.folderName,
      createdAtIso: now,
      lastModifiedIso: now,
      isReadOnly: false,
      origin: folderOrigin(scan.folderPath),
      artwork: scan.coverPath ? localCoverArtwork(scan.coverPath) : undefined,
      items: scan.files.map((file) => ({
        id: uuidv4(),
        track: trackFromLocalFile(file, tagsByPath.get(file.path)),
        addedAtIso: now,
      })),
    };

    const index = await playlistFileService.savePlaylist(playlist);

    set((state) => ({
      playlists: new Map(state.playlists).set(playlist.id, playlist),
      index,
    }));

    return playlist.id;
  },

  syncFolderPlaylist: async (id: string) => {
    const playlist = await get().loadPlaylist(id);
    if (!playlist?.origin || !isFolderPlaylist(playlist)) {
      return;
    }

    const scan = await scanMusicFolder(playlist.origin.id);
    const now = new Date().toISOString();
    const existingItemsByPath = new Map(
      playlist.items.map((item) => [item.track.localFile?.fileUri, item]),
    );
    const pathsMissingTags = scan.files
      .map((file) => file.path)
      .filter(
        (path) => !existingItemsByPath.get(path)?.track.localFile?.scannedAtIso,
      );
    const tagsByPath = await readAudioTags(pathsMissingTags);
    const items = scan.files.map((file) => {
      const existing = existingItemsByPath.get(file.path);
      const tags = tagsByPath.get(file.path);
      if (existing && !tags) {
        return existing;
      }
      return {
        id: existing?.id ?? uuidv4(),
        track: trackFromLocalFile(file, tags),
        addedAtIso: existing?.addedAtIso ?? now,
      };
    });
    const artwork =
      playlist.artwork ??
      (scan.coverPath ? localCoverArtwork(scan.coverPath) : undefined);

    const isUnchanged =
      artwork === playlist.artwork &&
      items.length === playlist.items.length &&
      items.every((item, position) => item === playlist.items[position]);
    if (isUnchanged) {
      return;
    }

    const updated: Playlist = {
      ...playlist,
      items,
      artwork,
      lastModifiedIso: now,
    };

    const index = await playlistFileService.savePlaylist(updated);

    set((state) => ({
      playlists: new Map(state.playlists).set(id, updated),
      index,
    }));
  },

  setPlaylistCover: async (id: string, imagePath: string) => {
    const savedPath = await saveCoverImage(id, imagePath);
    await get().updatePlaylist(id, { artwork: localCoverArtwork(savedPath) });
  },

  updatePlaylist: async (id, updates) => {
    const playlist = await get().loadPlaylist(id);
    if (!playlist) {
      throw new Error(`Playlist ${id} not found`);
    }

    const updated: Playlist = {
      ...playlist,
      ...updates,
      lastModifiedIso: new Date().toISOString(),
    };

    const index = await playlistFileService.savePlaylist(updated);

    set((state) => ({
      playlists: new Map(state.playlists).set(id, updated),
      index,
    }));
  },

  deletePlaylist: async (id: string) => {
    const index = await playlistFileService.deletePlaylist(id);

    set((state) => {
      const playlists = new Map(state.playlists);
      playlists.delete(id);
      return { playlists, index };
    });
  },
}));

export const initializePlaylistStore = async (): Promise<void> => {
  await usePlaylistStore.getState().loadIndex();
  void usePlaylistStore.getState().syncLibraryRoots();
};
