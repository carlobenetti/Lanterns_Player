import { DashboardWrapper } from './Dashboard.test-wrapper';

describe('Dashboard view', () => {
  beforeEach(() => {
    DashboardWrapper.reset();
    DashboardWrapper.seedPlaylists();
  });

  it('shows the empty state when there are no music folders', async () => {
    await DashboardWrapper.mount();

    expect(DashboardWrapper.emptyState).toBeInTheDocument();
  });

  it('shows folders on top and user playlists with a create button below', async () => {
    DashboardWrapper.seedPlaylists(
      DashboardWrapper.fixtures.folderPlaylist('Chill', '/music/chill'),
      DashboardWrapper.fixtures.userPlaylist('Road trip'),
    );
    await DashboardWrapper.mount();

    expect(DashboardWrapper.folderCardNames).toEqual(['Chill']);
    expect(DashboardWrapper.playlistCardNames).toEqual(['Road trip']);
    expect(DashboardWrapper.createPlaylistButton).toBeInTheDocument();
  });

  it('hides All music when there are no music folders', async () => {
    await DashboardWrapper.mount();

    expect(DashboardWrapper.allMusic.link).not.toBeInTheDocument();
  });

  it('lists the tracks of every folder in All music', async () => {
    DashboardWrapper.seedPlaylists(
      DashboardWrapper.fixtures.folderPlaylistWithTracks(
        'Chill',
        '/music/chill',
        ['Teardrop', 'Angel'],
      ),
      DashboardWrapper.fixtures.folderPlaylistWithTracks(
        'Rock',
        '/music/rock',
        ['Paranoid Android'],
      ),
      DashboardWrapper.fixtures.userPlaylist('Road trip'),
    );
    await DashboardWrapper.mount();

    expect(DashboardWrapper.allMusic.count).toHaveTextContent('3 tracks');
    await DashboardWrapper.allMusic.open();

    expect(await DashboardWrapper.allMusic.findTrack('Teardrop')).toBeVisible();
    expect(await DashboardWrapper.allMusic.findTrack('Angel')).toBeVisible();
    expect(
      await DashboardWrapper.allMusic.findTrack('Paranoid Android'),
    ).toBeVisible();
  });

  it('switches between light and dark mode from the sidebar', async () => {
    await DashboardWrapper.mount();
    const startedDark = DashboardWrapper.isDarkTheme;

    await DashboardWrapper.themeToggle.click();
    await vi.waitFor(() => {
      expect(DashboardWrapper.isDarkTheme).toBe(!startedDark);
    });

    await DashboardWrapper.themeToggle.click();
    await vi.waitFor(() => {
      expect(DashboardWrapper.isDarkTheme).toBe(startedDark);
    });
  });
});
