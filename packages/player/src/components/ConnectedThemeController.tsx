import { Moon, Sun } from 'lucide-react';
import { FC, useEffect } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { SidebarNavigationItem } from '@nuclearplayer/ui';

import { useCoreSetting } from '../hooks/useCoreSetting';

const ICON_SIZE = 20;

export const ConnectedThemeController: FC = () => {
  const { t } = useTranslation('navigation');
  const [isDark, setIsDark] = useCoreSetting<boolean>('theme.dark');

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDark]);

  return (
    <SidebarNavigationItem
      data-testid="theme-toggle"
      icon={isDark ? <Sun size={ICON_SIZE} /> : <Moon size={ICON_SIZE} />}
      label={isDark ? t('lightMode') : t('darkMode')}
      onClick={() => setIsDark(!isDark)}
    />
  );
};
