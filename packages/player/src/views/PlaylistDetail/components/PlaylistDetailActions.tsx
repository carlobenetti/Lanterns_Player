import { useNavigate } from '@tanstack/react-router';
import { ImageIcon, RefreshCwIcon, ShareIcon, Trash2Icon } from 'lucide-react';
import { useState, type FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import type { Track } from '@nuclearplayer/model';
import { Button, Dialog, Popover } from '@nuclearplayer/ui';

import { usePlaylistExport } from '../../../hooks/usePlaylistExport';
import { usePlaylistStore } from '../../../stores/playlistStore';
import { PlaylistActions } from '../../Playlists/components/PlaylistActions';
import { usePlaylistFolderActions } from '../usePlaylistFolderActions';

type PlaylistDetailActionsProps = {
  playlistId: string;
  tracks: Track[];
  isFolderPlaylist: boolean;
};

export const PlaylistDetailActions: FC<PlaylistDetailActionsProps> = ({
  playlistId,
  tracks,
  isFolderPlaylist,
}) => {
  const { t } = useTranslation('playlists');
  const navigate = useNavigate();
  const deletePlaylist = usePlaylistStore((state) => state.deletePlaylist);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { exportAsJson } = usePlaylistExport(playlistId);
  const { changeCover, rescanFolder } = usePlaylistFolderActions(playlistId);

  const handleDelete = async () => {
    await deletePlaylist(playlistId);
    setIsDeleteDialogOpen(false);
    navigate({ to: '/playlists' });
  };

  return (
    <>
      <PlaylistActions
        tracks={tracks}
        onPlay={
          isFolderPlaylist ? () => navigate({ to: '/now-playing' }) : undefined
        }
        menuItems={
          <>
            <Popover.Item
              icon={<ImageIcon size={16} />}
              onClick={changeCover}
              data-testid="change-cover-action"
            >
              {t('changeCover')}
            </Popover.Item>
            {isFolderPlaylist && (
              <Popover.Item
                icon={<RefreshCwIcon size={16} />}
                onClick={rescanFolder}
                data-testid="rescan-folder-action"
              >
                {t('rescanFolder')}
              </Popover.Item>
            )}
            <Popover.Item
              icon={<ShareIcon size={16} />}
              onClick={exportAsJson}
              data-testid="export-json-action"
            >
              {t('exportJson')}
            </Popover.Item>
            <Popover.Item
              intent="danger"
              icon={<Trash2Icon size={16} />}
              onClick={() => setIsDeleteDialogOpen(true)}
              data-testid="delete-playlist-action"
            >
              {t('delete')}
            </Popover.Item>
          </>
        }
      />
      <Dialog.Root
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <Dialog.Title>{t('delete')}</Dialog.Title>
        <Dialog.Description>{t('deleteConfirm')}</Dialog.Description>
        <Dialog.Actions>
          <Dialog.Close>{t('common:actions.cancel')}</Dialog.Close>
          <Button intent="danger" onClick={handleDelete}>
            {t('common:actions.delete')}
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
};
