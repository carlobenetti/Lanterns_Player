import { useFullscreenStore } from '../../stores/fullscreenStore';
import { useQueueStore } from '../../stores/queueStore';
import { useSoundStore } from '../../stores/soundStore';
import { NowPlayingWrapper as Wrapper } from './NowPlaying.test-wrapper';

beforeEach(() => {
  useQueueStore.setState({ items: [], currentIndex: 0 });
  useSoundStore.setState({ status: 'stopped', seek: 0, duration: 0 });
  useFullscreenStore.setState({ isFullscreen: false });
});

describe('Now playing view', () => {
  it('shows an empty state when nothing is queued', async () => {
    await Wrapper.mount();

    expect(Wrapper.emptyState).toBeInTheDocument();
  });

  it('shows the current track with its album and position in the queue', async () => {
    Wrapper.seedQueue(Wrapper.fixtures.album(), 1);
    await Wrapper.mount();

    expect(Wrapper.title).toHaveTextContent('Fibernet Speed');
    expect(Wrapper.artist).toHaveTextContent('Wavelength');
    expect(Wrapper.details).toHaveTextContent('Ego');
    expect(Wrapper.details).toHaveTextContent('Track 2 of 3');
    expect(Wrapper.cover).toHaveAttribute('src', 'https://example.com/ego.jpg');
  });

  it('shows a placeholder when the track has no cover', async () => {
    Wrapper.seedQueue(Wrapper.fixtures.album(), 0);
    await Wrapper.mount();

    expect(Wrapper.coverPlaceholder).toBeInTheDocument();
  });

  it('shows elapsed and total time', async () => {
    Wrapper.seedQueue(Wrapper.fixtures.album());
    Wrapper.seedPlayback(5, 130);
    await Wrapper.mount();

    expect(Wrapper.elapsed).toHaveTextContent('0:05');
    expect(Wrapper.total).toHaveTextContent('2:10');
  });

  it('renders the spectrum visualizer', async () => {
    Wrapper.seedQueue(Wrapper.fixtures.album());
    await Wrapper.mount();

    expect(Wrapper.spectrumVisualizer).toBeInTheDocument();
    expect(Wrapper.starfield).toBeInTheDocument();
  });

  it('hides the bottom player bar while Now playing is open', async () => {
    Wrapper.seedQueue(Wrapper.fixtures.album());
    await Wrapper.mount('/dashboard');
    expect(Wrapper.playerBarCover).toBeInTheDocument();

    await Wrapper.openFromPlayerBarCover();

    expect(Wrapper.playerBarCover).not.toBeInTheDocument();
  });

  it('shows only the cover, the track name, the wave and the queue in fullscreen', async () => {
    Wrapper.seedQueue(Wrapper.fixtures.album(), 1);
    await Wrapper.mount();

    await Wrapper.fullscreenButton.click();

    expect(Wrapper.isWindowFullscreen).toBe(true);
    expect(Wrapper.fullscreenStage).toBeInTheDocument();
    expect(Wrapper.title).toHaveTextContent('Fibernet Speed');
    expect(Wrapper.artist).toHaveTextContent('Wavelength');
    expect(Wrapper.cover).toBeInTheDocument();
    expect(Wrapper.spectrumVisualizer).toBeInTheDocument();
    expect(Wrapper.queuePanel).toBeInTheDocument();
    expect(Wrapper.leftSidebar).not.toBeInTheDocument();
    expect(Wrapper.controls).not.toBeInTheDocument();
  });

  it('leaves fullscreen with the exit button', async () => {
    Wrapper.seedQueue(Wrapper.fixtures.album());
    await Wrapper.mount();

    await Wrapper.fullscreenButton.click();
    await Wrapper.exitFullscreenButton.click();

    expect(Wrapper.isWindowFullscreen).toBe(false);
    expect(Wrapper.fullscreenStage).not.toBeInTheDocument();
    expect(Wrapper.leftSidebar).toBeInTheDocument();
  });

  it('leaves fullscreen with Escape', async () => {
    Wrapper.seedQueue(Wrapper.fixtures.album());
    await Wrapper.mount();

    await Wrapper.fullscreenButton.click();
    await Wrapper.pressEscape();

    expect(Wrapper.isWindowFullscreen).toBe(false);
    expect(Wrapper.fullscreenStage).not.toBeInTheDocument();
  });

  it('resumes and pauses playback', async () => {
    Wrapper.seedQueue(Wrapper.fixtures.album());
    Wrapper.seedPausedTrack();
    await Wrapper.mount();

    await Wrapper.playButton.click();
    expect(Wrapper.status).toBe('playing');

    await Wrapper.pauseButton.click();
    expect(Wrapper.status).toBe('paused');
  });

  it('skips to the next and previous tracks', async () => {
    Wrapper.seedQueue(Wrapper.fixtures.album());
    await Wrapper.mount();

    await Wrapper.nextButton.click();
    expect(Wrapper.title).toHaveTextContent('Fibernet Speed');

    await Wrapper.previousButton.click();
    expect(Wrapper.title).toHaveTextContent('Hadron Collider');
  });

  it('opens from the cover in the player bar', async () => {
    Wrapper.seedQueue(Wrapper.fixtures.album());
    await Wrapper.mount('/dashboard');

    await Wrapper.openFromPlayerBarCover();

    expect(Wrapper.title).toHaveTextContent('Hadron Collider');
  });

  it('opens from the sidebar', async () => {
    Wrapper.seedQueue(Wrapper.fixtures.album());
    await Wrapper.mount('/dashboard');

    await Wrapper.openFromSidebar();

    expect(Wrapper.title).toHaveTextContent('Hadron Collider');
  });
});
