import { QueryClient } from '@tanstack/react-query';
import { createMemoryHistory, createRouter } from '@tanstack/react-router';
import { platform } from '@tauri-apps/plugin-os';
import { render, RenderResult, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { QueueItem } from '@nuclearplayer/model';

import App from '../App';
import { routeTree } from '../routeTree.gen';
import { useQueueStore } from '../stores/queueStore';
import { useSoundStore } from '../stores/soundStore';

type MountResult = RenderResult & {
  router: ReturnType<typeof createRouter<typeof routeTree>>;
};

const user = userEvent.setup();

export const MobileLayoutWrapper = {
  useAndroid() {
    vi.mocked(platform).mockReturnValue('android');
  },

  useDesktop() {
    vi.mocked(platform).mockReturnValue('linux');
  },

  seedQueue(items: QueueItem[]) {
    useQueueStore.setState({ items, currentIndex: 0 });
  },

  resetPlayback() {
    useQueueStore.setState({ items: [], currentIndex: 0 });
    useSoundStore.setState({ status: 'stopped', seek: 0, duration: 0 });
  },

  async mount(initialPath = '/dashboard'): Promise<MountResult> {
    const history = createMemoryHistory({ initialEntries: [initialPath] });
    const router = createRouter({ routeTree, history });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const component = render(
      <App routerProp={router} queryClientProp={queryClient} />,
    );
    await screen.findByTestId('mobile-shell');
    return { ...component, router };
  },

  get desktopSidebarToggle() {
    return screen.queryByTestId('sidebar-toggle-left');
  },

  get desktopPlayerBar() {
    return screen.queryByTestId('player-shuffle-button');
  },

  tabs: {
    get element() {
      return screen.getByTestId('mobile-tab-bar');
    },
    tab(name: string) {
      return within(screen.getByTestId('mobile-tab-bar')).getByRole('link', {
        name,
      });
    },
    async open(name: string) {
      await user.click(this.tab(name));
    },
  },

  views: {
    async findDashboard() {
      return screen.findByTestId('dashboard-view');
    },
    async findQueue() {
      return screen.findByTestId('queue-view');
    },
    async findNowPlaying() {
      return screen.findByTestId('now-playing-view');
    },
    async findFavorites() {
      return screen.findByTestId('favorite-tracks-view');
    },
  },

  nowPlaying: {
    get compactStage() {
      return screen.getByTestId('now-playing-compact');
    },
    get seekBar() {
      return screen.getByTestId('now-playing-seek-bar');
    },
    get elapsed() {
      return screen.getByTestId('now-playing-elapsed');
    },
    get visualizer() {
      return screen.queryByTestId('spectrum-visualizer');
    },
    get starfield() {
      return screen.queryByTestId('starfield-background');
    },
  },

  songTable: {
    async findTitle(title: string) {
      const table = await screen.findByRole('table');
      return within(table).findByText(title);
    },
    get headers() {
      return within(screen.getByRole('table'))
        .getAllByRole('columnheader')
        .map((header) => header.textContent);
    },
  },

  miniPlayer: {
    get element() {
      return screen.getByTestId('mobile-mini-player');
    },
    get isVisible() {
      return screen.queryByTestId('mobile-mini-player') !== null;
    },
    get title() {
      return screen.getByTestId('mobile-mini-player-title');
    },
    get artist() {
      return screen.getByTestId('mobile-mini-player-artist');
    },
    get playPauseButton() {
      return within(this.element).getByTestId('mobile-mini-player-play-pause');
    },
    async open() {
      await user.click(this.title);
    },
    async togglePlay() {
      await user.click(this.playPauseButton);
    },
  },

  get isDarkTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  },

  header: {
    async toggleTheme() {
      await user.click(screen.getByTestId('theme-toggle'));
    },
    async openSettings() {
      await user.click(screen.getByTestId('mobile-settings-button'));
    },
    async addFolder() {
      await user.click(screen.getByTestId('add-folder-button'));
    },
  },

  folderBrowser: {
    async find() {
      return screen.findByTestId('folder-browser');
    },
    async findCurrentFolder() {
      return screen.findByTestId('folder-browser-current');
    },
    async folderNames() {
      const list = await screen.findByTestId('folder-browser-list');
      return within(list)
        .getAllByRole('button')
        .map((button) => button.textContent);
    },
    async open(name: string) {
      const list = await screen.findByTestId('folder-browser-list');
      await user.click(await within(list).findByRole('button', { name }));
    },
    async goUp() {
      await user.click(screen.getByTestId('folder-browser-up'));
    },
    async useThisFolder() {
      await user.click(screen.getByTestId('folder-browser-confirm'));
    },
  },

  async findSettings() {
    return screen.findByRole('dialog');
  },
};
