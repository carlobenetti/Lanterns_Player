import { Moon, Sun } from 'lucide-react';
import { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { SidebarNavigationItem } from '@nuclearplayer/ui';

import { useThemeMode } from '../hooks/useThemeMode';

const ICON_SIZE = 20;

export const ConnectedThemeController: FC = () => {
  const { t } = useTranslation('navigation');
  const { isDark, toggle } = useThemeMode();

  return (
    <SidebarNavigationItem
      data-testid="theme-toggle"
      icon={isDark ? <Sun size={ICON_SIZE} /> : <Moon size={ICON_SIZE} />}
      label={isDark ? t('lightMode') : t('darkMode')}
      onClick={toggle}
    />
  );
};
