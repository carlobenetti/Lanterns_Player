import isEmpty from 'lodash-es/isEmpty';
import sumBy from 'lodash-es/sumBy';
import { FC, useMemo } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import type { PlaylistIndexEntry } from '@nuclearplayer/model';
import { ViewShell } from '@nuclearplayer/ui';

import { isFolderPlaylist } from '../../services/localFolders';
import { usePlaylistStore } from '../../stores/playlistStore';
import { PlaylistsSection } from '../Playlists';
import { AllMusicBanner } from './components/AllMusicBanner';
import { DashboardEmptyState } from './components/DashboardEmptyState';
import { FolderPlaylistsSection } from './components/FolderPlaylistsSection';

const DashboardContent: FC<{
  folderPlaylists: PlaylistIndexEntry[];
  isSyncingLibrary: boolean;
}> = ({ folderPlaylists, isSyncingLibrary }) => {
  if (isSyncingLibrary && isEmpty(folderPlaylists)) {
    return <FolderPlaylistsSection.Skeleton />;
  }

  if (isEmpty(folderPlaylists)) {
    return <DashboardEmptyState />;
  }

  return <FolderPlaylistsSection playlists={folderPlaylists} />;
};

export const Dashboard: FC = () => {
  const { t } = useTranslation('dashboard');
  const playlistIndex = usePlaylistStore((state) => state.index);
  const isSyncingLibrary = usePlaylistStore((state) => state.isSyncingLibrary);
  const folderPlaylists = useMemo(
    () => playlistIndex.filter(isFolderPlaylist),
    [playlistIndex],
  );

  return (
    <ViewShell data-testid="dashboard-view" title={t('title')}>
      <div className="flex flex-col gap-10 pb-8">
        <DashboardContent
          folderPlaylists={folderPlaylists}
          isSyncingLibrary={isSyncingLibrary}
        />
        {!isEmpty(folderPlaylists) && (
          <AllMusicBanner
            trackCount={sumBy(folderPlaylists, (entry) => entry.itemCount)}
          />
        )}
        <PlaylistsSection />
      </div>
    </ViewShell>
  );
};
