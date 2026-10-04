import { useNavigate } from '@tanstack/react-router';
import isEmpty from 'lodash-es/isEmpty';
import { FC, ReactNode } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import type { PlaylistIndexEntry } from '@nuclearplayer/model';
import { CardGrid } from '@nuclearplayer/ui';

import {
  LARGE_GRID_CLASSES,
  PlaylistCardGrid,
} from '../../Playlists/components/PlaylistCardGrid';

const SKELETON_CARD_COUNT = 4;

const FolderSection: FC<{ children: ReactNode; 'data-testid': string }> = ({
  children,
  'data-testid': testId,
}) => {
  const { t } = useTranslation('dashboard');

  return (
    <section data-testid={testId} className="flex flex-col gap-4">
      <h2 className="text-foreground text-lg font-bold">
        {t('folders-title')}
      </h2>
      {children}
    </section>
  );
};

type FolderPlaylistsSectionProps = {
  playlists: PlaylistIndexEntry[];
};

const FolderPlaylistsSectionBase: FC<FolderPlaylistsSectionProps> = ({
  playlists,
}) => {
  const navigate = useNavigate();

  if (isEmpty(playlists)) {
    return null;
  }

  return (
    <FolderSection data-testid="dashboard-folder-playlists">
      <PlaylistCardGrid
        size="large"
        playlists={playlists}
        onCardClick={(id) =>
          navigate({
            to: '/playlists/$playlistId',
            params: { playlistId: id },
          })
        }
      />
    </FolderSection>
  );
};

const FolderPlaylistsSectionSkeleton: FC = () => (
  <FolderSection data-testid="dashboard-folder-playlists-skeleton">
    <CardGrid.Skeleton
      count={SKELETON_CARD_COUNT}
      className={LARGE_GRID_CLASSES}
    />
  </FolderSection>
);

export const FolderPlaylistsSection = Object.assign(
  FolderPlaylistsSectionBase,
  { Skeleton: FolderPlaylistsSectionSkeleton },
);
