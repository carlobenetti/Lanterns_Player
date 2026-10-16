import { LazyStore } from '@tauri-apps/plugin-store';
import { create } from 'zustand';

import type { ProviderRef, Track } from '@nuclearplayer/model';
import type { FavoriteEntry } from '@nuclearplayer/plugin-sdk';

const FAVORITES_FILE = 'favorites.json';
const store = new LazyStore(FAVORITES_FILE);

type FavoritesState = {
  tracks: FavoriteEntry<Track>[];
  loaded: boolean;

  loadFromDisk: () => Promise<void>;

  addTrack: (track: Track) => Promise<void>;
  removeTrack: (source: ProviderRef) => Promise<void>;
  isTrackFavorite: (source: ProviderRef) => boolean;
};

const matchesSource = (a: ProviderRef, b: ProviderRef): boolean =>
  a.provider === b.provider && a.id === b.id;

const saveToDisk = async (): Promise<void> => {
  await store.set('favorites.tracks', useFavoritesStore.getState().tracks);
  await store.save();
};

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  tracks: [],
  loaded: false,

  loadFromDisk: async () => {
    const tracks =
      (await store.get<FavoriteEntry<Track>[]>('favorites.tracks')) ?? [];
    set({ tracks, loaded: true });
  },

  addTrack: async (track) => {
    if (get().isTrackFavorite(track.source)) {
      return;
    }
    const entry: FavoriteEntry<Track> = {
      ref: track,
      addedAtIso: new Date().toISOString(),
    };
    set({ tracks: [...get().tracks, entry] });
    await saveToDisk();
  },

  removeTrack: async (source) => {
    set({
      tracks: get().tracks.filter(
        (entry) => !matchesSource(entry.ref.source, source),
      ),
    });
    await saveToDisk();
  },

  isTrackFavorite: (source) =>
    get().tracks.some((entry) => matchesSource(entry.ref.source, source)),
}));

export const initializeFavoritesStore = async (): Promise<void> => {
  await useFavoritesStore.getState().loadFromDisk();
};
