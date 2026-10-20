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
import { PlaylistBuilder } from '../../test/builders/PlaylistBuilder';
import { resetInMemoryTauriStore } from '../../test/utils/inMemoryTauriStore';

type MountResult = RenderResult & {
  router: ReturnType<typeof createRouter<typeof routeTree>>;
};

const findCard = (section: HTMLElement, text: string, label: string) => {
  const cards = within(section).getAllByTestId('card');
  const card = cards.find((card) => within(card).queryByText(text));
  if (!card) {
    throw new Error(`${label} "${text}" not found`);
  }
  return card;
};

export const DashboardWrapper = {
  reset() {
    resetInMemoryTauriStore();
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

  get folderCardNames() {
    return within(screen.getByTestId('dashboard-folder-playlists'))
      .getAllByTestId('card-title')
      .map((title) => title.textContent);
  },

  get playlistCardNames() {
    return within(screen.getByTestId('playlists-view'))
      .queryAllByTestId('card-title')
      .map((title) => title.textContent);
  },

  get createPlaylistButton() {
    return within(screen.getByTestId('playlists-view')).getByTestId(
      'create-playlist-button',
    );
  },

  allMusic: {
    get link() {
      return screen.queryByTestId('all-music-link');
    },
    get count() {
      return screen.getByTestId('all-music-count');
    },
    async open() {
      await userEvent.click(screen.getByTestId('all-music-link'));
      await screen.findByTestId('all-music-view');
    },
    async findTrack(title: string) {
      const table = await screen.findByRole('table');
      return within(table).findByText(title);
    },
  },

  folders: {
    async findSkeleton() {
      return screen.findByTestId('dashboard-folder-playlists-skeleton');
    },
    async findSection() {
      return screen.findByTestId('dashboard-folder-playlists');
    },
    async cardNames() {
      const section = await screen.findByTestId('dashboard-folder-playlists');
      return within(section)
        .getAllByTestId('card-title')
        .map((title) => title.textContent);
    },
    folder(name: string) {
      return {
        async find() {
          const section = await screen.findByTestId(
            'dashboard-folder-playlists',
          );
          await within(section).findByText(name);
          return findCard(section, name, 'Folder card');
        },
        async click() {
          await userEvent.click(await this.find());
        },
        async findCover() {
          return within(await this.find()).findByRole('img', { name });
        },
      };
    },
  },

  async simulateRestart() {
    await act(() => initializePlaylistStore());
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

  async mount(): Promise<MountResult> {
    const history = createMemoryHistory({ initialEntries: ['/dashboard'] });
    const router = createRouter({ routeTree, history });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const component = render(
      <App routerProp={router} queryClientProp={queryClient} />,
    );
    await screen.findByTestId('dashboard-view');
    return { ...component, router };
  },

  get emptyState() {
    return screen.queryByTestId('dashboard-empty-state');
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
