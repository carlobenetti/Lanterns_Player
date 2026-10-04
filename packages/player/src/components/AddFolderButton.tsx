import { FolderPlus } from 'lucide-react';
import { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { Button, Tooltip } from '@nuclearplayer/ui';

import { useAddMusicFolder } from '../hooks/useAddMusicFolder';

export const AddFolderButton: FC = () => {
  const { t } = useTranslation('dashboard');
  const { addMusicFolder, isAdding } = useAddMusicFolder();

  return (
    <Tooltip content={t('add-folder-tooltip')} side="bottom">
      <Button
        data-testid="add-folder-button"
        className="gap-2 font-bold"
        disabled={isAdding}
        onClick={addMusicFolder}
      >
        <FolderPlus size={20} />
        {t('add-folder')}
      </Button>
    </Tooltip>
  );
};
