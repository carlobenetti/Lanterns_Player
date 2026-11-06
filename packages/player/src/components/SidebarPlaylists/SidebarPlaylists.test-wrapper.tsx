import { createMemoryHistory, createRouter } from '@tanstack/react-router';
import { render, RenderResult, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DialogWrapper } from '@nuclearplayer/ui';

import App from '../../App';
import { routeTree } from '../../routeTree.gen';
import { usePlaylistStore } from '../../stores/playlistStore';
import { PlaylistBuilder } from '../../test/builders/PlaylistBuilder';

const user = userEvent.setup();

const section = () => screen.getByTestId('sidebar-playlists');

export const SidebarPlaylistsWrapper = {
  seedPlaylists(...builders: PlaylistBuilder[]) {
    const playlists = builders.map((builder) => builder.build());
    usePlaylistStore.setState({
      index: builders.map((builder) => builder.buildIndexEntry()),
      playlists: new Map(playlists.map((playlist) => [playlist.id, playlist])),
      loaded: true,
      isSyncingLibrary: false,
    });
  },

  async mount(): Promise<RenderResult> {
    const history = createMemoryHistory({ initialEntries: ['/library'] });
    const router = createRouter({ routeTree, history });
    const component = render(<App routerProp={router} />);
    await screen.findByTestId('sidebar-playlists');
    return component;
  },

  get names() {
    return within(section())
      .queryAllByTestId('sidebar-playlist')
      .map((item) => item.textContent);
  },

  playlist(name: string) {
    return {
      get element() {
        const item = within(section())
          .getAllByTestId('sidebar-playlist')
          .find((candidate) => candidate.textContent === name);
        if (!item) {
          throw new Error(`Sidebar playlist "${name}" not found`);
        }
        return item;
      },
      async click() {
        await user.click(this.element);
      },
    };
  },

  get detailTitle() {
    return screen.findByTestId('playlist-detail-title');
  },

  newPlaylistButton: {
    get element() {
      return screen.getByTestId('new-playlist-button');
    },
    async click() {
      await user.click(this.element);
    },
  },

  importButton: {
    get element() {
      return screen.getByTestId('import-playlist-button');
    },
    async click() {
      await user.click(this.element);
    },
  },

  createDialog: {
    isOpen: () => DialogWrapper.isOpen(),
    async createPlaylist(name: string) {
      await user.type(screen.getByTestId('playlist-name-input'), name);
      await user.click(DialogWrapper.getByText('Create new'));
    },
  },
};
