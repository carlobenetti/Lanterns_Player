import { Link } from '@tanstack/react-router';
import {
  AudioLinesIcon,
  HeartIcon,
  HistoryIcon,
  LibraryIcon,
  ListMusicIcon,
} from 'lucide-react';
import { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';

const ICON_SIZE = 22;

const TABS = [
  { to: '/dashboard', icon: LibraryIcon, label: 'dashboard' },
  { to: '/now-playing', icon: AudioLinesIcon, label: 'nowPlaying' },
  { to: '/queue', icon: ListMusicIcon, label: 'queue' },
  { to: '/favorites/tracks', icon: HeartIcon, label: 'favoriteTracks' },
  { to: '/history', icon: HistoryIcon, label: 'history' },
] as const;

export const MobileTabBar: FC = () => {
  const { t } = useTranslation('navigation');

  return (
    <nav
      data-testid="mobile-tab-bar"
      className="surface-background border-border grid shrink-0 grid-cols-5 border-t-(length:--border-width)"
    >
      {TABS.map(({ to, icon: Icon, label }) => (
        <Link
          key={to}
          to={to}
          className="group flex min-w-0 flex-col items-center gap-1 py-2 text-[11px] leading-none opacity-70 transition-opacity data-[status=active]:font-bold data-[status=active]:opacity-100"
        >
          <span className="group-data-[status=active]:bg-primary rounded-full px-4 py-1">
            <Icon size={ICON_SIZE} />
          </span>
          <span className="max-w-full truncate px-1">{t(label)}</span>
        </Link>
      ))}
    </nav>
  );
};
