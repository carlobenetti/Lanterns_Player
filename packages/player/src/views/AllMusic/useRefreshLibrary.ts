import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@nuclearplayer/i18n';

import { Logger } from '../../services/logger';
import { usePlaylistStore } from '../../stores/playlistStore';

export const useRefreshLibrary = () => {
  const { t } = useTranslation('dashboard');
  const refreshLibrary = usePlaylistStore((state) => state.refreshLibrary);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshLibrary();
      toast.success(t('refresh-library-success'));
    } catch (error) {
      Logger.playlists.error(`Failed to refresh library: ${String(error)}`);
      toast.error(t('refresh-library-error'));
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshLibrary, t]);

  return { refresh, isRefreshing };
};
