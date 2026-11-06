import { QueryClient } from '@tanstack/react-query';
import { createMemoryHistory, createRouter } from '@tanstack/react-router';
import {
  act,
  render,
  RenderResult,
  screen,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from '../../App';
import { routeTree } from '../../routeTree.gen';
import { LOCAL_FOLDER_PROVIDER } from '../../services/localFolders';
import {
  initializePlaylistStore,
  usePlaylistStore,
} from '../../stores/playlistStore';
import { useQueueStore } from '../../stores/queueStore';
import { PlaylistBuilder } from '../../test/builders/PlaylistBuilder';
import { resetInMemoryTauriStore } from '../../test/utils/inMemoryTauriStore';

type MountResult = RenderResult & {
  router: ReturnType<typeof createRouter<typeof routeTree>>;
};

const findSidebarPlaylist = async (name: string) => {
  const section = await screen.findByTestId('sidebar-playlists');
  await within(section).findByText(name);
  const playlist = within(section)
    .getAllByTestId('sidebar-playlist')
    .find((item) => item.textContent === name);
  if (!playlist) {
    throw new Error(`Sidebar playlist "${name}" not found`);
  }
  return playlist;
};

export const AllMusicWrapper = {
  reset() {
    resetInMemoryTauriStore();
    useQueueStore.getState().clearQueue();
  },

  seedPlaylists(...builders: PlaylistBuilder[]) {
    const playlists = builders.map((builder) => builder.build());
    usePlaylistStore.setState({
      index: builders.map((builder) => builder.buildIndexEntry()),
      playlists: new Map(playlists.map((playlist) => [playlist.id, playlist])),
      loaded: true,
      isSyncingLibrary: false,
    });
  },

  async mount(initialPath = '/'): Promise<MountResult> {
    const history = createMemoryHistory({ initialEntries: [initialPath] });
    const router = createRouter({ routeTree, history });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const component = render(
      <App routerProp={router} queryClientProp={queryClient} />,
    );
    await screen.findByTestId('all-music-view');
    return { ...component, router };
  },

  async simulateRestart() {
    await act(() => initializePlaylistStore());
  },

  get view() {
    return screen.getByTestId('all-music-view');
  },

  get title() {
    return within(this.view).getByTestId('title');
  },

  get emptyState() {
    return within(this.view).queryByTestId('empty-state');
  },

  async findTrack(title: string) {
    const table = await screen.findByRole('table');
    return within(table).findByText(title);
  },

  hasTrack(title: string) {
    return within(screen.getByRole('table')).queryByText(title) !== null;
  },

  async playTrack(title: string) {
    await this.findTrack(title);
    const row = screen
      .getAllByTestId('track-row')
      .find((candidate) => within(candidate).queryByText(title));
    if (!row) {
      throw new Error(`Track row "${title}" not found`);
    }
    await userEvent.click(within(row).getByTestId('play-now-button'));
  },

  get queueTitles() {
    return useQueueStore.getState().items.map((item) => item.track.title);
  },

  refreshButton: {
    get element() {
      return screen.getByTestId('refresh-library-button');
    },
    async click() {
      await userEvent.click(this.element);
    },
  },

  openFilesButton: {
    get element() {
      return screen.getByTestId('open-files-button');
    },
    async click() {
      await userEvent.click(this.element);
    },
  },

  addFolderButton: {
    get element() {
      return screen.getByTestId('add-folder-button');
    },
    async click() {
      await userEvent.click(this.element);
    },
  },

  themeToggle: {
    get element() {
      return screen.getByTestId('theme-toggle');
    },
    async click() {
      await userEvent.click(this.element);
    },
  },

  get isDarkTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  },

  navigation: {
    get labels() {
      return screen
        .getAllByTestId('sidebar-navigation-item')
        .map((item) => item.textContent);
    },
    async open(label: string) {
      await userEvent.click(screen.getByText(label));
    },
  },

  sidebar: {
    async playlistNames() {
      const section = await screen.findByTestId('sidebar-playlists');
      return within(section)
        .queryAllByTestId('sidebar-playlist')
        .map((item) => item.textContent);
    },
    playlist(name: string) {
      return {
        async find() {
          return findSidebarPlaylist(name);
        },
        async click() {
          await userEvent.click(await findSidebarPlaylist(name));
        },
        async findCover() {
          return within(await findSidebarPlaylist(name)).findByRole('img', {
            name,
          });
        },
      };
    },
  },

  openedPlaylist: {
    async findTitle() {
      return screen.findByTestId('playlist-detail-title');
    },
    async findTrack(title: string) {
      const table = await screen.findByRole('table');
      return within(table).findByText(title);
    },
    get removeButtons() {
      return screen.queryAllByLabelText('Remove from list');
    },
  },

  fixtures: {
    userPlaylist(name: string) {
      return new PlaylistBuilder().withName(name).withTrackCount(1);
    },
    folderPlaylistWithTracks(
      name: string,
      folderPath: string,
      trackNames: string[],
    ) {
      return new PlaylistBuilder()
        .withName(name)
        .withOrigin({ provider: LOCAL_FOLDER_PROVIDER, id: folderPath })
        .withTrackNames(trackNames);
    },
    folderPlaylist(name: string, folderPath: string) {
      return new PlaylistBuilder()
        .withName(name)
        .withOrigin({ provider: LOCAL_FOLDER_PROVIDER, id: folderPath })
        .withTrackCount(2);
    },
  },
};
