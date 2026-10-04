import { useParams } from '@tanstack/react-router';
import { useEffect, useMemo } from 'react';

import type { PlaylistItem } from '@nuclearplayer/model';

import { isFolderPlaylist } from '../../services/localFolders';
import { Logger } from '../../services/logger';
import { buildThumbnails } from '../../services/playlistFileService/buildThumbnails';
import { usePlaylistStore } from '../../stores/playlistStore';

const EMPTY_ITEMS: PlaylistItem[] = [];

export const usePlaylistDetail = () => {
  const { playlistId } = useParams({ from: '/playlists/$playlistId' });
  const loadPlaylist = usePlaylistStore((state) => state.loadPlaylist);
  const syncFolderPlaylist = usePlaylistStore(
    (state) => state.syncFolderPlaylist,
  );
  const playlist = usePlaylistStore((state) => state.playlists.get(playlistId));

  useEffect(() => {
    const loadAndSync = async () => {
      const loaded = await loadPlaylist(playlistId);
      if (loaded && isFolderPlaylist(loaded)) {
        await syncFolderPlaylist(playlistId);
      }
    };

    loadAndSync().catch((error) =>
      Logger.playlists.warn(
        `Could not sync folder playlist ${playlistId}: ${String(error)}`,
      ),
    );
  }, [playlistId, loadPlaylist, syncFolderPlaylist]);

  const items = playlist?.items ?? EMPTY_ITEMS;
  const tracks = useMemo(() => items.map((item) => item.track), [items]);
  const thumbnails = useMemo(
    () => (playlist ? buildThumbnails(playlist) : []),
    [playlist],
  );

  return { playlistId, playlist, items, tracks, thumbnails };
};
