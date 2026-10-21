import { useEffect } from 'react';

import { useCoreSetting } from './useCoreSetting';

export const useThemeMode = () => {
  const [storedIsDark, setIsDark] = useCoreSetting<boolean>('theme.dark');
  const isDark = storedIsDark ?? true;

  return { isDark, toggle: () => setIsDark(!isDark) };
};

export const useApplyThemeMode = () => {
  const { isDark } = useThemeMode();

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDark]);
};
