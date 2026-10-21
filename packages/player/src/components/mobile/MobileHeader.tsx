import { FolderPlus, Moon, Settings, Sun } from 'lucide-react';
import { FC, useState } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { Button, TopBarLogo } from '@nuclearplayer/ui';

import { useAddMusicFolder } from '../../hooks/useAddMusicFolder';
import { useThemeMode } from '../../hooks/useThemeMode';
import { useSettingsModalStore } from '../../stores/settingsModalStore';
import { FolderBrowserDialog } from '../FolderBrowserDialog';

const ICON_SIZE = 22;

export const MobileHeader: FC = () => {
  const { t } = useTranslation('dashboard');
  const { t: tPreferences } = useTranslation('preferences');
  const { t: tTitleBar } = useTranslation('titleBar');
  const { t: tNavigation } = useTranslation('navigation');
  const theme = useThemeMode();
  const openSettings = useSettingsModalStore((state) => state.open);
  const { addFolderPath, isAdding } = useAddMusicFolder();
  const [isFolderBrowserOpen, setIsFolderBrowserOpen] = useState(false);

  return (
    <header className="surface-background border-border flex h-14 shrink-0 items-center gap-2 border-b-(length:--border-width) pr-2 pl-4">
      <TopBarLogo className="size-7 shrink-0" />
      <span className="font-heading flex-1 truncate text-lg font-bold">
        {tTitleBar('title')}
      </span>
      <Button
        size="icon"
        variant="text"
        data-testid="add-folder-button"
        aria-label={t('add-folder')}
        disabled={isAdding}
        onClick={() => setIsFolderBrowserOpen(true)}
      >
        <FolderPlus size={ICON_SIZE} />
      </Button>
      <Button
        size="icon"
        variant="text"
        data-testid="theme-toggle"
        aria-label={
          theme.isDark ? tNavigation('lightMode') : tNavigation('darkMode')
        }
        onClick={theme.toggle}
      >
        {theme.isDark ? <Sun size={ICON_SIZE} /> : <Moon size={ICON_SIZE} />}
      </Button>
      <Button
        size="icon"
        variant="text"
        data-testid="mobile-settings-button"
        aria-label={tPreferences('title')}
        onClick={() => openSettings()}
      >
        <Settings size={ICON_SIZE} />
      </Button>
      <FolderBrowserDialog
        isOpen={isFolderBrowserOpen}
        onClose={() => setIsFolderBrowserOpen(false)}
        onSelect={(folderPath) => {
          setIsFolderBrowserOpen(false);
          void addFolderPath(folderPath);
        }}
      />
    </header>
  );
};
