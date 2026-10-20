import uniqBy from 'lodash-es/uniqBy';
import { useEffect, useMemo, useState } from 'react';

import { isFolderPlaylist } from '../../services/localFolders';
import { Logger } from '../../services/logger';
import { usePlaylistStore } from '../../stores/playlistStore';

export const useAllMusicTracks = () => {
  const index = usePlaylistStore((state) => state.index);
  const playlists = usePlaylistStore((state) => state.playlists);
  const loadPlaylist = usePlaylistStore((state) => state.loadPlaylist);
  const [isLoading, setIsLoading] = useState(true);

  const folderIds = useMemo(
    () => index.filter(isFolderPlaylist).map((entry) => entry.id),
    [index],
  );

  useEffect(() => {
    Promise.all(folderIds.map((id) => loadPlaylist(id)))
      .catch((error) =>
        Logger.playlists.warn(`Could not load all music: ${String(error)}`),
      )
      .finally(() => setIsLoading(false));
  }, [folderIds, loadPlaylist]);

  const tracks = useMemo(
    () =>
      uniqBy(
        folderIds.flatMap((id) =>
          (playlists.get(id)?.items ?? []).map((item) => item.track),
        ),
        (track) => track.source.id,
      ),
    [folderIds, playlists],
  );

  return { tracks, isLoading };
};
