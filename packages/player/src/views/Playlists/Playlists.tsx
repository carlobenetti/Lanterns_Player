import { useNavigate } from '@tanstack/react-router';
import isEmpty from 'lodash-es/isEmpty';
import { ListMusic, SearchX } from 'lucide-react';
import { useMemo, type FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { EmptyState } from '@nuclearplayer/ui';

import { isFolderPlaylist } from '../../services/localFolders';
import { usePlaylistStore } from '../../stores/playlistStore';
import { CreatePlaylistDialog } from './components/CreatePlaylistDialog';
import { PlaylistCardGrid } from './components/PlaylistCardGrid';
import { PlaylistsToolbar } from './components/PlaylistsToolbar';
import { usePlaylistFilter } from './hooks/usePlaylistFilter';
import { usePlaylistSort } from './hooks/usePlaylistSort';
import { PlaylistsProvider } from './PlaylistsContext';

const EMPTY_ICON_SIZE = 40;

const PlaylistsContent: FC = () => {
  const { t } = useTranslation('playlists');
  const navigate = useNavigate();
  const index = usePlaylistStore((state) => state.index);
  const userPlaylists = useMemo(
    () => index.filter((entry) => !isFolderPlaylist(entry)),
    [index],
  );
  const { filter, setFilter, filteredPlaylists, hasFilter } =
    usePlaylistFilter(userPlaylists);
  const {
    sortBy,
    setSortBy,
    sortDirection,
    toggleSortDirection,
    sortedPlaylists,
  } = usePlaylistSort(filteredPlaylists);
  const hasPlaylists = !isEmpty(userPlaylists);
  const hasResults = !isEmpty(filteredPlaylists);

  return (
    <section data-testid="playlists-view" className="flex flex-col gap-4">
      <h2 className="text-foreground text-lg font-bold">{t('title')}</h2>
      <PlaylistsToolbar
        filter={filter}
        onFilterChange={setFilter}
        hasPlaylists={hasPlaylists}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortDirection={sortDirection}
        onToggleSortDirection={toggleSortDirection}
      />

      {!hasPlaylists && (
        <EmptyState
          size="sm"
          icon={<ListMusic size={EMPTY_ICON_SIZE} />}
          title={t('empty')}
          description={t('emptyDescription')}
        />
      )}

      {hasPlaylists && hasFilter && !hasResults && (
        <EmptyState
          size="sm"
          icon={<SearchX size={EMPTY_ICON_SIZE} />}
          title={t('filterNoResults')}
          description={t('filterNoResultsDescription')}
          data-testid="filter-empty-state"
        />
      )}

      {hasPlaylists && hasResults && (
        <PlaylistCardGrid
          playlists={sortedPlaylists}
          onCardClick={(id) =>
            navigate({
              to: '/playlists/$playlistId',
              params: { playlistId: id },
            })
          }
        />
      )}

      <CreatePlaylistDialog />
    </section>
  );
};

export const PlaylistsSection: FC = () => (
  <PlaylistsProvider>
    <PlaylistsContent />
  </PlaylistsProvider>
);
