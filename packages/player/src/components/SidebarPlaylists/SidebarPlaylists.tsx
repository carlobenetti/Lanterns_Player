import head from 'lodash-es/head';
import isEmpty from 'lodash-es/isEmpty';
import sortBy from 'lodash-es/sortBy';
import { FolderIcon, Import, ListMusic, Plus } from 'lucide-react';
import { FC, useMemo } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import type { PlaylistIndexEntry } from '@nuclearplayer/model';
import { SidebarNavigationItem, useSidebarCompact } from '@nuclearplayer/ui';

import { usePlaylistImport } from '../../hooks/usePlaylistImport';
import { isFolderPlaylist } from '../../services/localFolders';
import { usePlaylistStore } from '../../stores/playlistStore';
import {
  CreatePlaylistDialog,
  PlaylistsProvider,
  useCreatePlaylistContext,
} from '../../views/Playlists';

const ICON_SIZE = 20;

const PlaylistIcon: FC<{ playlist: PlaylistIndexEntry }> = ({ playlist }) => {
  const cover = head(playlist.thumbnails);
  if (cover) {
    return (
      <img
        src={cover}
        alt={playlist.name}
        className="border-border size-6 rounded-sm border-(length:--border-width) object-cover"
      />
    );
  }
  return isFolderPlaylist(playlist) ? (
    <FolderIcon size={ICON_SIZE} />
  ) : (
    <ListMusic size={ICON_SIZE} />
  );
};

const SidebarPlaylistsContent: FC = () => {
  const { t } = useTranslation('navigation');
  const { t: tPlaylists } = useTranslation('playlists');
  const isCompact = useSidebarCompact();
  const index = usePlaylistStore((state) => state.index);
  const { openCreateDialog } = useCreatePlaylistContext();
  const { importFromJson } = usePlaylistImport();
  const playlists = useMemo(
    () => sortBy(index, (entry) => (isFolderPlaylist(entry) ? 0 : 1)),
    [index],
  );

  return (
    <section data-testid="sidebar-playlists" className="flex flex-col gap-2">
      <div className="border-border my-1 border-t-(length:--border-width)" />
      {!isCompact && (
        <h2 className="px-2 text-xs font-bold tracking-wide uppercase opacity-70">
          {t('playlists')}
        </h2>
      )}
      {!isEmpty(playlists) &&
        playlists.map((playlist) => (
          <SidebarNavigationItem
            key={playlist.id}
            data-testid="sidebar-playlist"
            to={`/playlists/${playlist.id}`}
            icon={<PlaylistIcon playlist={playlist} />}
            label={playlist.name}
          />
        ))}
      <SidebarNavigationItem
        data-testid="new-playlist-button"
        icon={<Plus size={ICON_SIZE} />}
        label={t('newPlaylist')}
        onClick={openCreateDialog}
      />
      <SidebarNavigationItem
        data-testid="import-playlist-button"
        icon={<Import size={ICON_SIZE} />}
        label={tPlaylists('importJson')}
        onClick={importFromJson}
      />
      <CreatePlaylistDialog />
    </section>
  );
};

export const SidebarPlaylists: FC = () => (
  <PlaylistsProvider>
    <SidebarPlaylistsContent />
  </PlaylistsProvider>
);
