import { act } from '@testing-library/react';

import type { QueueItem } from '@nuclearplayer/model';

import { initAndroidMediaControls } from '../services/androidMediaControls';
import { useSoundStore } from '../stores/soundStore';
import { createQueueItem } from '../test/fixtures/queue';
import { AndroidMediaBridgeMock } from '../test/mocks/androidMediaBridge';
import { resetInMemoryTauriStore } from '../test/utils/inMemoryTauriStore';
import { DashboardWrapper } from '../views/Dashboard/Dashboard.test-wrapper';
import { MobileLayoutWrapper as Wrapper } from './MobileLayout.test-wrapper';

const COVER_PATH = '/storage/emulated/0/Music/Chill/cover.jpg';
const SEEK_TARGET_MS = 30_000;

const withCover = (item: QueueItem): QueueItem => ({
  ...item,
  track: {
    ...item.track,
    artwork: {
      items: [
        { url: `http://asset.localhost/${encodeURIComponent(COVER_PATH)}` },
      ],
    },
  },
});

describe('Android media controls', () => {
  const bridge = new AndroidMediaBridgeMock();
  let stopMediaControls: () => void;

  beforeEach(() => {
    resetInMemoryTauriStore();
    DashboardWrapper.seedPlaylists();
    Wrapper.resetPlayback();
    Wrapper.useAndroid();
    bridge.updates.length = 0;
    bridge.install();
    stopMediaControls = initAndroidMediaControls();
  });

  afterEach(() => {
    stopMediaControls();
    bridge.uninstall();
    Wrapper.useDesktop();
  });

  it('shows the playing song in the Android notification', async () => {
    Wrapper.seedQueue([createQueueItem('Teardrop'), createQueueItem('Angel')]);
    act(() => useSoundStore.setState({ status: 'playing', duration: 200 }));
    await Wrapper.mount();

    expect(bridge.lastState).toMatchObject({
      hasTrack: true,
      title: 'Teardrop',
      artist: 'Test Artist',
      isPlaying: true,
      durationMs: 200_000,
    });
  });

  it('sends the cover file of the song so Android can show it', async () => {
    Wrapper.seedQueue([withCover(createQueueItem('Teardrop'))]);
    await Wrapper.mount();

    expect(bridge.lastState?.coverPath).toBe(COVER_PATH);
  });

  it('pauses when the notification pause button is pressed', async () => {
    Wrapper.seedQueue([createQueueItem('Teardrop')]);
    act(() => useSoundStore.setState({ status: 'playing' }));
    await Wrapper.mount();

    bridge.press('pause');

    expect(Wrapper.miniPlayer.playPauseButton).toHaveAccessibleName('Play');
    expect(bridge.lastState?.isPlaying).toBe(false);
  });

  it('skips to the next song when the notification next button is pressed', async () => {
    Wrapper.seedQueue([createQueueItem('Teardrop'), createQueueItem('Angel')]);
    await Wrapper.mount();

    bridge.press('next');

    expect(Wrapper.miniPlayer.title).toHaveTextContent('Angel');
    expect(bridge.lastState?.title).toBe('Angel');
  });

  it('seeks when the lock screen progress bar is dragged', async () => {
    Wrapper.seedQueue([createQueueItem('Teardrop')]);
    act(() => useSoundStore.setState({ duration: 200 }));
    await Wrapper.mount('/now-playing');

    bridge.press('seek', SEEK_TARGET_MS);

    expect(Wrapper.nowPlaying.elapsed).toHaveTextContent('0:30');
  });
});
