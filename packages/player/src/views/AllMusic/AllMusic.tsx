import isEmpty from 'lodash-es/isEmpty';
import { LibraryBig } from 'lucide-react';
import type { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { EmptyState, Loader, ViewShell } from '@nuclearplayer/ui';

import { ConnectedTrackTable } from '../../components/ConnectedTrackTable';
import { useAllMusicTracks } from './useAllMusicTracks';

const EMPTY_ICON_SIZE = 48;

export const AllMusic: FC = () => {
  const { t } = useTranslation('dashboard');
  const { tracks, isLoading } = useAllMusicTracks();

  if (isLoading && isEmpty(tracks)) {
    return (
      <ViewShell data-testid="all-music-view" title={t('all-music')}>
        <div className="flex flex-1 items-center justify-center">
          <Loader size="xl" />
        </div>
      </ViewShell>
    );
  }

  return (
    <ViewShell data-testid="all-music-view" title={t('all-music')}>
      {isEmpty(tracks) ? (
        <EmptyState
          icon={<LibraryBig size={EMPTY_ICON_SIZE} />}
          title={t('all-music-empty')}
          description={t('all-music-empty-description')}
          className="flex-1"
        />
      ) : (
        <ConnectedTrackTable
          tracks={tracks}
          features={{
            header: true,
            filterable: true,
            sortable: true,
            playAll: true,
            addAllToQueue: true,
          }}
          display={{
            displayThumbnail: true,
            displayArtist: true,
            displayDuration: tracks.some((track) => track.durationMs != null),
            displayQueueControls: true,
          }}
        />
      )}
    </ViewShell>
  );
};
