import { act } from '@testing-library/react';

import {
  initializePlaylistStore,
  usePlaylistStore,
} from '../stores/playlistStore';
import { useSoundStore } from '../stores/soundStore';
import {
  ANDROID_CHILL_PATH,
  ANDROID_CHILL_SCAN,
  ANDROID_CHILL_SELECTION,
  ANDROID_FOLDER_LISTINGS,
  ANDROID_MUSIC_PATH,
  ANDROID_MUSIC_SELECTION,
  ANDROID_STORAGE_ROOTS,
} from '../test/fixtures/localFolders';
import { createQueueItem } from '../test/fixtures/queue';
import { ok } from '../test/utils/commandMocks';
import { resetInMemoryTauriStore } from '../test/utils/inMemoryTauriStore';
import { DashboardWrapper } from '../views/Dashboard/Dashboard.test-wrapper';
import { MobileLayoutWrapper as Wrapper } from './MobileLayout.test-wrapper';

const commandMocks = await vi.hoisted(async () => {
  const { TauriCommandMocks } = await import('../test/utils/commandMocks');
  return new TauriCommandMocks();
});

vi.mock('../services/tauri/bindings', () => commandMocks.moduleFactory());

const programPhoneStorage = () => {
  commandMocks.command('storageRoots').mockResolvedValue(ANDROID_STORAGE_ROOTS);
  commandMocks
    .command('listFolder')
    .mockImplementation(async (path) => ok(ANDROID_FOLDER_LISTINGS[path]));
  commandMocks
    .command('scanMusicFolder')
    .mockResolvedValue(ok(ANDROID_CHILL_SCAN));
  commandMocks.command('readAudioTags').mockResolvedValue(ok([]));
};

describe('Mobile layout', () => {
  beforeEach(() => {
    resetInMemoryTauriStore();
    DashboardWrapper.seedPlaylists();
    Wrapper.resetPlayback();
    commandMocks.reset();
    Wrapper.useAndroid();
  });

  afterEach(() => {
    Wrapper.useDesktop();
  });

  it('shows bottom tabs and a mini player instead of the desktop sidebars', async () => {
    Wrapper.seedQueue([createQueueItem('Teardrop')]);
    await Wrapper.mount();

    expect(Wrapper.tabs.element).toBeInTheDocument();
    expect(Wrapper.miniPlayer.element).toBeInTheDocument();
    expect(Wrapper.desktopSidebarToggle).not.toBeInTheDocument();
    expect(Wrapper.desktopPlayerBar).not.toBeInTheDocument();
  });

  it('hides the mini player while nothing is queued', async () => {
    await Wrapper.mount();

    expect(Wrapper.miniPlayer.isVisible).toBe(false);
  });

  it('switches screens from the bottom tabs', async () => {
    await Wrapper.mount();

    await Wrapper.tabs.open('Queue');
    expect(await Wrapper.views.findQueue()).toBeInTheDocument();

    await Wrapper.tabs.open('Now playing');
    expect(await Wrapper.views.findNowPlaying()).toBeInTheDocument();

    await Wrapper.tabs.open('Favorite tracks');
    expect(await Wrapper.views.findFavorites()).toBeInTheDocument();

    await Wrapper.tabs.open('Library');
    expect(await Wrapper.views.findDashboard()).toBeInTheDocument();
  });

  it('shows the current track in the mini player and opens Now Playing when tapped', async () => {
    Wrapper.seedQueue([createQueueItem('Teardrop')]);
    await Wrapper.mount();

    expect(Wrapper.miniPlayer.title).toHaveTextContent('Teardrop');
    expect(Wrapper.miniPlayer.artist).toHaveTextContent('Test Artist');

    await Wrapper.miniPlayer.open();

    expect(await Wrapper.views.findNowPlaying()).toBeInTheDocument();
  });

  it('shows a compact Now Playing without the animated visualizer', async () => {
    Wrapper.seedQueue([createQueueItem('Teardrop')]);
    await Wrapper.mount('/now-playing');

    expect(Wrapper.nowPlaying.compactStage).toHaveTextContent('Teardrop');
    expect(Wrapper.nowPlaying.seekBar).toBeInTheDocument();
    expect(Wrapper.nowPlaying.visualizer).not.toBeInTheDocument();
    expect(Wrapper.nowPlaying.starfield).not.toBeInTheDocument();
    expect(Wrapper.miniPlayer.isVisible).toBe(false);
  });

  it('shows song titles without the duration column in a playlist', async () => {
    DashboardWrapper.seedPlaylists(
      DashboardWrapper.fixtures
        .folderPlaylistWithTracks('Chill', ANDROID_CHILL_PATH, ['Teardrop'])
        .withId('chill'),
    );
    await Wrapper.mount('/playlists/chill');

    expect(await Wrapper.songTable.findTitle('Teardrop')).toBeVisible();
    expect(Wrapper.songTable.headers).not.toContain('Duration');
  });

  it('pauses playback from the mini player', async () => {
    Wrapper.seedQueue([createQueueItem('Teardrop')]);
    useSoundStore.setState({ status: 'playing' });
    await Wrapper.mount();

    await Wrapper.miniPlayer.togglePlay();

    expect(useSoundStore.getState().status).toBe('paused');
  });

  it('starts in dark mode, like the Lantern suit', async () => {
    await Wrapper.mount();

    expect(Wrapper.isDarkTheme).toBe(true);
  });

  it('switches between dark and light mode from the header', async () => {
    await Wrapper.mount();

    await Wrapper.header.toggleTheme();
    expect(Wrapper.isDarkTheme).toBe(false);

    await Wrapper.header.toggleTheme();
    expect(Wrapper.isDarkTheme).toBe(true);
  });

  it('opens the settings from the header', async () => {
    await Wrapper.mount();

    await Wrapper.header.openSettings();

    expect(await Wrapper.findSettings()).toBeInTheDocument();
  });

  it('adds a phone folder picked in the folder browser', async () => {
    programPhoneStorage();
    commandMocks
      .command('resolveMusicFolders')
      .mockResolvedValue(ok(ANDROID_CHILL_SELECTION));
    await Wrapper.mount();

    await Wrapper.header.addFolder();
    expect(await Wrapper.folderBrowser.findCurrentFolder()).toHaveTextContent(
      'Internal storage',
    );
    expect(await Wrapper.folderBrowser.folderNames()).toEqual([
      'Download',
      'Music',
    ]);

    await Wrapper.folderBrowser.open('Music');
    await Wrapper.folderBrowser.open('Chill');
    expect(await Wrapper.folderBrowser.findCurrentFolder()).toHaveTextContent(
      'Chill',
    );

    await Wrapper.folderBrowser.useThisFolder();

    expect(await DashboardWrapper.folders.cardNames()).toEqual(['Chill']);
    expect(commandMocks.command('resolveMusicFolders')).toHaveBeenCalledWith(
      ANDROID_CHILL_PATH,
    );
  });

  it('goes back to the parent folder in the folder browser', async () => {
    programPhoneStorage();
    await Wrapper.mount();

    await Wrapper.header.addFolder();
    await Wrapper.folderBrowser.open('Music');
    expect(await Wrapper.folderBrowser.folderNames()).toEqual(['Chill']);

    await Wrapper.folderBrowser.goUp();

    expect(await Wrapper.folderBrowser.folderNames()).toEqual([
      'Download',
      'Music',
    ]);
  });

  it('loads the phone Music folder as the default library', async () => {
    programPhoneStorage();
    commandMocks
      .command('resolveMusicFolders')
      .mockResolvedValue(ok(ANDROID_MUSIC_SELECTION));

    await act(() => initializePlaylistStore());
    await Wrapper.mount();

    expect(await DashboardWrapper.folders.cardNames()).toEqual(['Chill']);
    expect(commandMocks.command('resolveMusicFolders')).toHaveBeenCalledWith(
      ANDROID_MUSIC_PATH,
    );
    expect(usePlaylistStore.getState().index).toHaveLength(1);
  });
});
