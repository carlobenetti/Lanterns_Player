import { useCallback } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@nuclearplayer/i18n';

import { pickCoverImage } from '../../services/localFolders';
import { Logger } from '../../services/logger';
import { usePlaylistStore } from '../../stores/playlistStore';

export const usePlaylistFolderActions = (playlistId: string) => {
  const { t } = useTranslation('playlists');
  const setPlaylistCover = usePlaylistStore((state) => state.setPlaylistCover);
  const syncFolderPlaylist = usePlaylistStore(
    (state) => state.syncFolderPlaylist,
  );

  const changeCover = useCallback(async () => {
    const imagePath = await pickCoverImage();
    if (!imagePath) {
      return;
    }

    try {
      await setPlaylistCover(playlistId, imagePath);
    } catch (error) {
      Logger.playlists.error(`Failed to change cover: ${String(error)}`);
      toast.error(t('changeCoverError'));
    }
  }, [playlistId, setPlaylistCover, t]);

  const rescanFolder = useCallback(async () => {
    try {
      await syncFolderPlaylist(playlistId);
      toast.success(t('rescanFolderSuccess'));
    } catch (error) {
      Logger.playlists.error(`Failed to rescan folder: ${String(error)}`);
      toast.error(t('rescanFolderError'));
    }
  }, [playlistId, syncFolderPlaylist, t]);

  return { changeCover, rescanFolder };
};
