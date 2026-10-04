import isEmpty from 'lodash-es/isEmpty';
import { FC, useMemo } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import type { PlaylistIndexEntry } from '@nuclearplayer/model';
import type { DashboardProvider } from '@nuclearplayer/plugin-sdk';
import { ViewShell } from '@nuclearplayer/ui';

import { useProviders } from '../../hooks/useProviders';
import { isFolderPlaylist } from '../../services/localFolders';
import { usePlaylistStore } from '../../stores/playlistStore';
import { useStartupStore } from '../../stores/startupStore';
import { DashboardEmptyState } from './components/DashboardEmptyState';
import { DashboardStartupSkeleton } from './components/DashboardStartupSkeleton';
import { FolderPlaylistsSection } from './components/FolderPlaylistsSection';
import { DASHBOARD_WIDGETS, DashboardWidgetEntry } from './dashboardWidgets';

const DashboardContent: FC<{
  isStartingUp: boolean;
  activeWidgets: DashboardWidgetEntry[];
  folderPlaylists: PlaylistIndexEntry[];
  isSyncingLibrary: boolean;
}> = ({ isStartingUp, activeWidgets, folderPlaylists, isSyncingLibrary }) => {
  if (isStartingUp) {
    return <DashboardStartupSkeleton />;
  }

  if (isSyncingLibrary && isEmpty(folderPlaylists)) {
    return <FolderPlaylistsSection.Skeleton />;
  }

  if (isEmpty(activeWidgets) && isEmpty(folderPlaylists)) {
    return <DashboardEmptyState />;
  }

  return (
    <>
      <FolderPlaylistsSection playlists={folderPlaylists} />
      {activeWidgets.map(({ capability, component: Widget }) => (
        <Widget key={capability} />
      ))}
    </>
  );
};

export const Dashboard: FC = () => {
  const { t } = useTranslation('dashboard');
  const isStartingUp = useStartupStore((state) => state.isStartingUp);
  const providers = useProviders('dashboard') as DashboardProvider[];
  const playlistIndex = usePlaylistStore((state) => state.index);
  const isSyncingLibrary = usePlaylistStore((state) => state.isSyncingLibrary);
  const folderPlaylists = useMemo(
    () => playlistIndex.filter(isFolderPlaylist),
    [playlistIndex],
  );

  const activeWidgets = useMemo(() => {
    const capabilities = new Set(
      providers.flatMap((provider) => provider.capabilities),
    );

    return DASHBOARD_WIDGETS.filter((widget) =>
      capabilities.has(widget.capability),
    );
  }, [providers]);

  return (
    <ViewShell data-testid="dashboard-view" title={t('title')}>
      <DashboardContent
        isStartingUp={isStartingUp}
        activeWidgets={activeWidgets}
        folderPlaylists={folderPlaylists}
        isSyncingLibrary={isSyncingLibrary}
      />
    </ViewShell>
  );
};
