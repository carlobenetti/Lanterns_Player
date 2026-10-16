import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createProviderRef, createTrack } from '../test/fixtures/favorites';
import { resetInMemoryTauriStore } from '../test/utils/inMemoryTauriStore';
import { initializeFavoritesStore, useFavoritesStore } from './favoritesStore';

const MOCK_ISO_DATE = '2025-02-01T00:00:00.000Z';

describe('useFavoritesStore', () => {
  beforeEach(() => {
    const date = new Date(MOCK_ISO_DATE);
    vi.setSystemTime(date);
    resetInMemoryTauriStore();
    useFavoritesStore.setState({
      tracks: [],
      loaded: false,
    });
  });

  describe('initial state', () => {
    it('starts with no tracks and loaded: false', () => {
      const state = useFavoritesStore.getState();
      expect(state.tracks).toEqual([]);
      expect(state.loaded).toBe(false);
    });
  });

  describe('tracks', () => {
    describe('addTrack', () => {
      it('adds a track with timestamp', async () => {
        const trackRef = createTrack('spotify', 'track-1');
        await useFavoritesStore.getState().addTrack(trackRef);

        const state = useFavoritesStore.getState();
        expect(state.tracks).toHaveLength(1);
        expect(state.tracks[0].ref).toEqual(trackRef);
        expect(state.tracks[0].addedAtIso).toBe(MOCK_ISO_DATE);
      });

      it('does not add duplicate (same provider + id)', async () => {
        const trackRef1 = createTrack('spotify', 'track-1');
        const trackRef2 = createTrack('spotify', 'track-1');
        trackRef2.title = 'Different Title';

        await useFavoritesStore.getState().addTrack(trackRef1);
        await useFavoritesStore.getState().addTrack(trackRef2);

        const state = useFavoritesStore.getState();
        expect(state.tracks).toHaveLength(1);
        expect(state.tracks[0].ref.title).toBe('Track track-1');
      });

      it('allows same id from different provider', async () => {
        const trackRef1 = createTrack('spotify', 'track-1');
        const trackRef2 = createTrack('youtube', 'track-1');

        await useFavoritesStore.getState().addTrack(trackRef1);
        await useFavoritesStore.getState().addTrack(trackRef2);

        const state = useFavoritesStore.getState();
        expect(state.tracks).toHaveLength(2);
      });
    });

    describe('removeTrack', () => {
      it('removes by provider + id', async () => {
        const trackRef = createTrack('spotify', 'track-1');
        await useFavoritesStore.getState().addTrack(trackRef);

        await useFavoritesStore
          .getState()
          .removeTrack(createProviderRef('spotify', 'track-1'));

        const state = useFavoritesStore.getState();
        expect(state.tracks).toHaveLength(0);
      });

      it('does nothing if not found', async () => {
        const trackRef = createTrack('spotify', 'track-1');
        await useFavoritesStore.getState().addTrack(trackRef);

        await useFavoritesStore
          .getState()
          .removeTrack(createProviderRef('spotify', 'track-2'));

        const state = useFavoritesStore.getState();
        expect(state.tracks).toHaveLength(1);
      });

      it('matches only provider + id, ignoring other fields', async () => {
        const trackRef = createTrack('spotify', 'track-1');
        await useFavoritesStore.getState().addTrack(trackRef);

        await useFavoritesStore.getState().removeTrack({
          provider: 'spotify',
          id: 'track-1',
          url: 'https://example.com/different-url',
        });

        const state = useFavoritesStore.getState();
        expect(state.tracks).toHaveLength(0);
      });
    });

    describe('isTrackFavorite', () => {
      it('returns true when track is favorite', async () => {
        const trackRef = createTrack('spotify', 'track-1');
        await useFavoritesStore.getState().addTrack(trackRef);

        const result = useFavoritesStore
          .getState()
          .isTrackFavorite(createProviderRef('spotify', 'track-1'));

        expect(result).toBe(true);
      });

      it('returns false when track is not favorite', () => {
        const result = useFavoritesStore
          .getState()
          .isTrackFavorite(createProviderRef('spotify', 'track-1'));

        expect(result).toBe(false);
      });

      it('matches only provider + id', async () => {
        const trackRef = createTrack('spotify', 'track-1');
        await useFavoritesStore.getState().addTrack(trackRef);

        const result = useFavoritesStore.getState().isTrackFavorite({
          provider: 'spotify',
          id: 'track-1',
          url: 'https://different-url.com',
        });

        expect(result).toBe(true);
      });
    });
  });

  describe('persistence', () => {
    it('loadFromDisk restores state and sets loaded: true', async () => {
      const trackRef = createTrack('spotify', 'track-1');

      await useFavoritesStore.getState().addTrack(trackRef);

      await new Promise((resolve) => setTimeout(resolve, 10));

      useFavoritesStore.setState({
        tracks: [],
        loaded: false,
      });

      await initializeFavoritesStore();

      const state = useFavoritesStore.getState();
      expect(state.tracks).toHaveLength(1);
      expect(state.tracks[0].ref.title).toBe('Track track-1');
      expect(state.loaded).toBe(true);
    });

    it('changes survive reload', async () => {
      const trackRef = createTrack('spotify', 'track-1');
      await useFavoritesStore.getState().addTrack(trackRef);

      await useFavoritesStore
        .getState()
        .removeTrack(createProviderRef('spotify', 'track-1'));

      await new Promise((resolve) => setTimeout(resolve, 10));

      useFavoritesStore.setState({
        tracks: [],
        loaded: false,
      });

      await initializeFavoritesStore();

      const state = useFavoritesStore.getState();
      expect(state.tracks).toHaveLength(0);
    });
  });
});
