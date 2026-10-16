import { QueryClient } from '@tanstack/react-query';
import { createMemoryHistory, createRouter } from '@tanstack/react-router';
import { render, RenderResult, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { QueueItem } from '@nuclearplayer/model';

import App from '../../App';
import { routeTree } from '../../routeTree.gen';
import { useQueueStore } from '../../stores/queueStore';
import { useSoundStore } from '../../stores/soundStore';
import { createQueueItem } from '../../test/fixtures/queue';

const user = userEvent.setup();

type MountResult = RenderResult & {
  router: ReturnType<typeof createRouter<typeof routeTree>>;
};

const button = (testId: string) => ({
  get element() {
    return screen.getByTestId(testId);
  },
  async click() {
    await user.click(this.element);
  },
});

export const NowPlayingWrapper = {
  async mount(initialPath = '/now-playing'): Promise<MountResult> {
    const history = createMemoryHistory({ initialEntries: [initialPath] });
    const router = createRouter({ routeTree, history });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const component = render(
      <App routerProp={router} queryClientProp={queryClient} />,
    );
    await screen.findByTestId(
      initialPath === '/now-playing' ? 'now-playing-view' : 'dashboard-view',
    );
    return { ...component, router };
  },

  seedQueue(items: QueueItem[], currentIndex = 0) {
    useQueueStore.setState({ items, currentIndex });
  },

  seedPlayback(seekSeconds: number, durationSeconds: number) {
    useSoundStore.setState({ seek: seekSeconds, duration: durationSeconds });
  },

  seedPausedTrack() {
    useSoundStore.setState({ status: 'paused' });
  },

  get view() {
    return screen.getByTestId('now-playing-view');
  },
  get emptyState() {
    return within(this.view).getByTestId('now-playing-empty');
  },
  get title() {
    return within(this.view).getByTestId('now-playing-stage-title');
  },
  get artist() {
    return within(this.view).getByTestId('now-playing-stage-artist');
  },
  get details() {
    return within(this.view).getByTestId('now-playing-stage-details');
  },
  get cover() {
    return within(this.view).getByTestId('now-playing-stage-cover');
  },
  get coverPlaceholder() {
    return within(this.view).getByTestId('now-playing-stage-cover-placeholder');
  },
  get spectrumBars() {
    return within(this.view).getAllByTestId('spectrum-bar');
  },
  get elapsed() {
    return within(this.view).getByTestId('now-playing-elapsed');
  },
  get total() {
    return within(this.view).getByTestId('now-playing-total');
  },

  playButton: button('now-playing-play-button'),
  pauseButton: button('now-playing-pause-button'),
  nextButton: button('now-playing-next-button'),
  previousButton: button('now-playing-previous-button'),

  get status() {
    return useSoundStore.getState().status;
  },

  async openFromPlayerBarCover() {
    await user.click(screen.getByTestId('player-now-playing-cover'));
    await screen.findByTestId('now-playing-view');
  },

  async openFromSidebar() {
    await user.click(screen.getByRole('link', { name: 'Now playing' }));
    await screen.findByTestId('now-playing-view');
  },

  fixtures: {
    album() {
      const tracks = ['Hadron Collider', 'Fibernet Speed', 'Notice Me'].map(
        (title) => {
          const item = createQueueItem(title);
          item.track.artists = [{ name: 'Wavelength', roles: ['primary'] }];
          item.track.album = {
            title: 'Ego',
            source: { provider: 'test', id: 'ego' },
          };
          return item;
        },
      );
      tracks[1].track.artwork = {
        items: [{ url: 'https://example.com/ego.jpg' }],
      };
      return tracks;
    },
  },
};
