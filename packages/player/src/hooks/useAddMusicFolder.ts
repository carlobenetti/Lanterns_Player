import { useNavigate } from '@tanstack/react-router';
import isEmpty from 'lodash-es/isEmpty';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@nuclearplayer/i18n';

import { pickMusicFolder } from '../services/localFolders';
import { Logger } from '../services/logger';
import { usePlaylistStore } from '../stores/playlistStore';

export const useAddMusicFolder = () => {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const addMusicFolder = usePlaylistStore((state) => state.addMusicFolder);
  const [isAdding, setIsAdding] = useState(false);

  const addFolderPath = useCallback(
    async (folderPath: string) => {
      setIsAdding(true);
      const toastId = toast.loading(t('folder-adding'));
      try {
        const playlistIds = await addMusicFolder(folderPath);
        if (isEmpty(playlistIds)) {
          toast.error(t('folder-empty'), { id: toastId });
          return;
        }

        const [firstPlaylistId] = playlistIds;
        const name = usePlaylistStore
          .getState()
          .index.find((entry) => entry.id === firstPlaylistId)?.name;
        const message =
          playlistIds.length === 1
            ? t('folder-added', { name })
            : t('library-added', { count: playlistIds.length });
        toast.success(message, { id: toastId });
        navigate({ to: '/dashboard' });
      } catch (error) {
        Logger.playlists.error(
          `Failed to add music folder ${folderPath}: ${String(error)}`,
        );
        toast.error(t('folder-add-error'), { id: toastId });
      } finally {
        setIsAdding(false);
      }
    },
    [addMusicFolder, navigate, t],
  );

  const pickAndAddMusicFolder = useCallback(async () => {
    const folderPath = await pickMusicFolder();
    if (folderPath) {
      await addFolderPath(folderPath);
    }
  }, [addFolderPath]);

  return { addMusicFolder: pickAndAddMusicFolder, addFolderPath, isAdding };
};
