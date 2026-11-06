import isEmpty from 'lodash-es/isEmpty';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@nuclearplayer/i18n';

import { useQueueActions } from '../../hooks/useQueueActions';
import {
  localAudioFileFromPath,
  pickAudioFiles,
  readAudioTags,
  trackFromLocalFile,
} from '../../services/localFolders';
import { Logger } from '../../services/logger';

export const useOpenLocalFiles = () => {
  const { t } = useTranslation('dashboard');
  const { clearQueue, addToQueue } = useQueueActions();
  const [isOpening, setIsOpening] = useState(false);

  const openFiles = useCallback(async () => {
    setIsOpening(true);
    try {
      const paths = await pickAudioFiles();
      if (isEmpty(paths)) {
        return;
      }
      const tags = await readAudioTags(paths);
      const tracks = paths.map((path) =>
        trackFromLocalFile(localAudioFileFromPath(path), tags.get(path)),
      );
      clearQueue();
      addToQueue(tracks);
    } catch (error) {
      Logger.playlists.error(`Failed to open local files: ${String(error)}`);
      toast.error(t('open-files-error'));
    } finally {
      setIsOpening(false);
    }
  }, [addToQueue, clearQueue, t]);

  return { openFiles, isOpening };
};
