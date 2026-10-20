import { Link } from '@tanstack/react-router';
import { ChevronRight, LibraryBig } from 'lucide-react';
import { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';

const ICON_SIZE = 28;

type AllMusicBannerProps = {
  trackCount: number;
};

export const AllMusicBanner: FC<AllMusicBannerProps> = ({ trackCount }) => {
  const { t } = useTranslation('dashboard');

  return (
    <Link
      to="/library"
      data-testid="all-music-link"
      className="surface-card border-border shadow-shadow group flex items-center gap-4 rounded-md border-(length:--border-width) p-4 transition-transform hover:-translate-y-0.5"
    >
      <div className="surface-primary border-border flex size-14 shrink-0 items-center justify-center rounded-md border-(length:--border-width)">
        <LibraryBig size={ICON_SIZE} />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="text-foreground text-lg font-bold">
          {t('all-music')}
        </span>
        <span
          data-testid="all-music-count"
          className="text-foreground truncate text-sm opacity-70"
        >
          {t('all-music-count', { count: trackCount })} ·{' '}
          {t('all-music-description')}
        </span>
      </div>
      <ChevronRight className="ml-auto shrink-0 transition-transform group-hover:translate-x-1" />
    </Link>
  );
};
