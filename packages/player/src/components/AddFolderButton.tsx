import { FolderPlus } from 'lucide-react';
import { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { SidebarNavigationItem } from '@nuclearplayer/ui';

import { useAddMusicFolder } from '../hooks/useAddMusicFolder';

export const AddFolderButton: FC = () => {
  const { t } = useTranslation('dashboard');
  const { addMusicFolder, isAdding } = useAddMusicFolder();

  return (
    <SidebarNavigationItem
      data-testid="add-folder-button"
      icon={<FolderPlus size={20} />}
      label={t('add-folder')}
      onClick={() => {
        if (!isAdding) {
          addMusicFolder();
        }
      }}
    />
  );
};
