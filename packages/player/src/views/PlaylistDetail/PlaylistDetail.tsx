import isEmpty from 'lodash-es/isEmpty';
import { ListMusicIcon } from 'lucide-react';
import type { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { EmptyState, ScrollableArea } from '@nuclearplayer/ui';

import { ConnectedTrackTable } from '../../components/ConnectedTrackTable';
import { isFolderPlaylist } from '../../services/localFolders';
import { PlaylistDetailHeader } from '../Playlists/components/PlaylistDetailHeader';
import { PlaylistDetailActions } from './components/PlaylistDetailActions';
import { usePlaylistDetail } from './usePlaylistDetail';
import { usePlaylistEditing } from './usePlaylistEditing';

export const PlaylistDetail: FC = () => {
  const { t } = useTranslation('playlists');
  const { playlistId, playlist, items, tracks, thumbnails } =
    usePlaylistDetail();
  const isFolder = Boolean(playlist && isFolderPlaylist(playlist));
  const editing = usePlaylistEditing(
    playlistId,
    items,
    Boolean(playlist && !playlist.isReadOnly && !isFolder),
  );

  return (
    <ScrollableArea
      className="surface-background"
      data-testid="playlist-detail-view"
    >
      {playlist && (
        <PlaylistDetailHeader
          playlist={playlist}
          thumbnails={thumbnails}
          className="mx-3 mt-3 sm:mx-6 sm:mt-6"
        >
          <PlaylistDetailActions
            playlistId={playlistId}
            tracks={tracks}
            isFolderPlaylist={isFolder}
          />
        </PlaylistDetailHeader>
      )}
      {isEmpty(tracks) ? (
        <EmptyState
          icon={<ListMusicIcon size={48} />}
          title={t('emptyTracks')}
          description={t('emptyTracksDescription')}
          className="flex-1"
        />
      ) : (
        <div className="h-full p-3 sm:p-6">
          <ConnectedTrackTable
            tracks={tracks}
            getItemId={editing.getItemId}
            features={{ header: true, reorderable: editing.isEditable }}
            display={{
              displayThumbnail: true,
              displayArtist: true,
              displayDuration: tracks.some((t) => t.durationMs != null),
              displayQueueControls: true,
              displayDeleteButton: editing.isEditable,
            }}
            actions={editing.actions}
          />
        </div>
      )}
    </ScrollableArea>
  );
};
