import { type FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import type { PlaylistIndexEntry } from '@nuclearplayer/model';
import { Card, CardGrid } from '@nuclearplayer/ui';

import { PlaylistArtwork } from './PlaylistArtwork';

type PlaylistCardGridSize = 'default' | 'large';

export const LARGE_GRID_CLASSES =
  'grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-6';

const LARGE_CARD_CLASSES =
  'w-full p-3 [&_[data-testid=card-title]]:text-lg [&_[data-testid=card-title]~div]:text-sm';

type PlaylistCardGridProps = {
  playlists: PlaylistIndexEntry[];
  onCardClick: (id: string) => void;
  size?: PlaylistCardGridSize;
};

export const PlaylistCardGrid: FC<PlaylistCardGridProps> = ({
  playlists,
  onCardClick,
  size = 'default',
}) => {
  const { t } = useTranslation('playlists');
  const isLarge = size === 'large';

  return (
    <CardGrid className={isLarge ? LARGE_GRID_CLASSES : undefined}>
      {playlists.map((playlist) => (
        <Card
          key={playlist.id}
          className={isLarge ? LARGE_CARD_CLASSES : undefined}
          image={
            <PlaylistArtwork
              name={playlist.name}
              thumbnails={playlist.thumbnails}
            />
          }
          title={playlist.name}
          subtitle={t('trackCount', { count: playlist.itemCount })}
          onClick={() => onCardClick(playlist.id)}
        />
      ))}
    </CardGrid>
  );
};
