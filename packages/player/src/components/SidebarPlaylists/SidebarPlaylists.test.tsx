import * as dialog from '@tauri-apps/plugin-dialog';
import * as fs from '@tauri-apps/plugin-fs';
import { type Mock } from 'vitest';

import type { Playlist } from '@nuclearplayer/model';

import { usePlaylistStore } from '../../stores/playlistStore';
import { PlaylistBuilder } from '../../test/builders/PlaylistBuilder';
import { resetInMemoryTauriStore } from '../../test/utils/inMemoryTauriStore';
import { SidebarPlaylistsWrapper } from './SidebarPlaylists.test-wrapper';

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  save: vi.fn(),
}));

const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
    success: (...args: unknown[]) => toastSuccess(...args),
  },
}));

vi.mock('@tauri-apps/plugin-fs', async () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
}));

const mockPlaylistFile = (playlist: Playlist) =>
  JSON.stringify({ version: 1, playlist }, null, 2);

describe('Sidebar playlists', () => {
  beforeEach(() => {
    resetInMemoryTauriStore();
    SidebarPlaylistsWrapper.seedPlaylists();
  });

  it('opens a playlist when clicking it', async () => {
    SidebarPlaylistsWrapper.seedPlaylists(
      new PlaylistBuilder().withName('Rock Classics').withTrackCount(3),
    );
    await SidebarPlaylistsWrapper.mount();

    await SidebarPlaylistsWrapper.playlist('Rock Classics').click();

    expect(await SidebarPlaylistsWrapper.detailTitle).toHaveTextContent(
      'Rock Classics',
    );
  });

  it('creates a playlist and lists it in the sidebar', async () => {
    await SidebarPlaylistsWrapper.mount();

    await SidebarPlaylistsWrapper.newPlaylistButton.click();
    expect(SidebarPlaylistsWrapper.createDialog.isOpen()).toBe(true);
    await SidebarPlaylistsWrapper.createDialog.createPlaylist('Gym');

    expect(SidebarPlaylistsWrapper.createDialog.isOpen()).toBe(false);
    await vi.waitFor(() => {
      expect(SidebarPlaylistsWrapper.names).toEqual(['Gym']);
    });
  });

  describe('import from JSON', () => {
    it('imports a playlist from a JSON file and lists it', async () => {
      const exportedPlaylist = new PlaylistBuilder()
        .withName('Imported Playlist')
        .withTrackNames(['Blue in Green', 'Naima'])
        .build();
      (dialog.open as Mock).mockResolvedValueOnce('/path/to/playlist.json');
      (fs.readTextFile as Mock).mockResolvedValueOnce(
        mockPlaylistFile(exportedPlaylist),
      );

      await SidebarPlaylistsWrapper.mount();
      await SidebarPlaylistsWrapper.importButton.click();

      await vi.waitFor(() => {
        expect(SidebarPlaylistsWrapper.names).toEqual(['Imported Playlist']);
      });
      expect(toastSuccess).toHaveBeenCalledWith('Playlist imported');
    });

    it('does nothing when the user cancels the file picker', async () => {
      (dialog.open as Mock).mockResolvedValueOnce(null);

      await SidebarPlaylistsWrapper.mount();
      await SidebarPlaylistsWrapper.importButton.click();

      expect(SidebarPlaylistsWrapper.names).toEqual([]);
    });

    it('shows an error toast when the file contains invalid JSON', async () => {
      (dialog.open as Mock).mockResolvedValueOnce('/path/to/bad.json');
      (fs.readTextFile as Mock).mockResolvedValueOnce('not valid json {{{');

      await SidebarPlaylistsWrapper.mount();
      await SidebarPlaylistsWrapper.importButton.click();

      await vi.waitFor(() => {
        expect(toastError).toHaveBeenCalledWith(
          'Failed to import playlist',
          expect.objectContaining({ description: expect.any(String) }),
        );
      });
      expect(usePlaylistStore.getState().index).toHaveLength(0);
    });
  });
});
