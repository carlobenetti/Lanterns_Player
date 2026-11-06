import { FileAudioIcon } from 'lucide-react';
import type { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { Button, Tooltip } from '@nuclearplayer/ui';

import { useOpenLocalFiles } from './useOpenLocalFiles';

const ICON_SIZE = 16;

export const OpenFilesButton: FC = () => {
  const { t } = useTranslation('dashboard');
  const { openFiles, isOpening } = useOpenLocalFiles();

  return (
    <Tooltip content={t('open-files')} side="bottom">
      <Button
        size="icon"
        onClick={openFiles}
        disabled={isOpening}
        aria-label={t('open-files')}
        data-testid="open-files-button"
      >
        <FileAudioIcon size={ICON_SIZE} strokeWidth={3} />
      </Button>
    </Tooltip>
  );
};
