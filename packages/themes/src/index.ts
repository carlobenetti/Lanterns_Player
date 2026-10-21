import { generateAdvancedThemeCSS } from './advanced/generator';
import { parseAdvancedTheme } from './advanced/parse';
import {
  AdvancedTheme,
  AdvancedThemeSchema,
  MarketplaceTheme,
  MarketplaceThemeRegistrySchema,
  MarketplaceThemeSchema,
} from './advanced/schema';
import { BUILTIN_BASIC_THEME_IDS, DEFAULT_THEME_ID } from './basic';

export type BasicThemeMeta = {
  id: string;
  name: string;
  palette: [string, string, string, string];
};

const BUILT_INS: BasicThemeMeta[] = [
  {
    id: DEFAULT_THEME_ID,
    name: 'Green Lantern',
    palette: [
      'oklch(0.46 0.065 178)',
      'oklch(0.68 0.08 175)',
      'oklch(0.29 0.042 188)',
      'oklch(0.17 0.022 205)',
    ],
  },
];

export function listBasicThemes(): BasicThemeMeta[] {
  const allowed = new Set<string>(BUILTIN_BASIC_THEME_IDS as readonly string[]);
  return BUILT_INS.filter((t) => allowed.has(t.id));
}

const withTransitionsSuspended = (changeTheme: () => void): void => {
  document.documentElement.setAttribute('data-transitions', 'suspended');
  changeTheme();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.removeAttribute('data-transitions');
    });
  });
};

export function setThemeId(id: string): void {
  withTransitionsSuspended(() => {
    document.documentElement.setAttribute('data-theme-id', id);
  });
}

export function setBasicTheme(id: string): void {
  setThemeId(id);
}

export function applyAdvancedTheme(theme: AdvancedTheme): void {
  const parsed = AdvancedThemeSchema.parse(theme);
  const css = generateAdvancedThemeCSS(parsed);
  withTransitionsSuspended(() => {
    let style = document.getElementById(
      'advanced-theme',
    ) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = 'advanced-theme';
      document.head.appendChild(style);
    }
    style.textContent = css;
  });
}

export function clearAdvancedTheme(): void {
  withTransitionsSuspended(() => {
    const style = document.getElementById('advanced-theme');
    if (style?.parentNode) {
      style.parentNode.removeChild(style);
    }
  });
}

export type { AdvancedTheme, MarketplaceTheme };
export {
  AdvancedThemeSchema,
  BUILTIN_BASIC_THEME_IDS,
  DEFAULT_THEME_ID,
  MarketplaceThemeRegistrySchema,
  MarketplaceThemeSchema,
};
export { parseAdvancedTheme };
