import type {
  LocalAudioTags,
  LocalFolderScan,
  MusicFolderSelection,
} from '../../services/tauri/bindings';
import {
  CHILL_FOLDER_PATH,
  CHILL_FOLDER_SCAN,
  CHILL_FOLDER_SCAN_WITH_NEW_FILE,
  CHILL_FOLDER_SCAN_WITH_RENAMED_FILE,
  CHILL_FOLDER_SELECTION,
  CHILL_FOLDER_TAGS,
  EMPTY_FOLDER_SELECTION,
  LOOSE_AUDIO_FILE_TAGS,
  LOOSE_AUDIO_FILES,
  MUSIC_LIBRARY_PATH,
  MUSIC_LIBRARY_SCANS,
  MUSIC_LIBRARY_SELECTION,
  MUSIC_LIBRARY_SELECTION_WITH_NEW_FOLDER,
} from '../../test/fixtures/localFolders';
import { PluginDialogMock } from '../../test/mocks/plugin-dialog';
import { ok } from '../../test/utils/commandMocks';
import { AllMusicWrapper } from './AllMusic.test-wrapper';

const commandMocks = await vi.hoisted(async () => {
  const { TauriCommandMocks } = await import('../../test/utils/commandMocks');
  return new TauriCommandMocks();
});

vi.mock('../../services/tauri/bindings', () => commandMocks.moduleFactory());

vi.mock('@tauri-apps/api/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tauri-apps/api/core')>()),
  convertFileSrc: (path: string) => `asset://${path}`,
}));

const programMusicFolder = ({
  pickedPath,
  selection,
  scans,
  tags = [],
}: {
  pickedPath: string;
  selection: MusicFolderSelection;
  scans: Record<string, LocalFolderScan>;
  tags?: LocalAudioTags[];
}) => {
  PluginDialogMock.setOpen(pickedPath);
  commandMocks.command('resolveMusicFolders').mockResolvedValue(ok(selection));
  commandMocks
    .command('scanMusicFolder')
    .mockImplementation(async (path) => ok(scans[path]));
  commandMocks
    .command('readAudioTags')
    .mockImplementation(async (paths) =>
      ok(tags.filter((entry) => paths.includes(entry.path))),
    );
};

const programChillFolder = (tags: LocalAudioTags[] = []) =>
  programMusicFolder({
    pickedPath: CHILL_FOLDER_PATH,
    selection: CHILL_FOLDER_SELECTION,
    scans: { [CHILL_FOLDER_PATH]: CHILL_FOLDER_SCAN },
    tags,
  });

const programMusicLibrary = () =>
  programMusicFolder({
    pickedPath: MUSIC_LIBRARY_PATH,
    selection: MUSIC_LIBRARY_SELECTION,
    scans: MUSIC_LIBRARY_SCANS,
  });

describe('All music', () => {
  beforeEach(() => {
    AllMusicWrapper.reset();
    AllMusicWrapper.seedPlaylists();
    commandMocks.reset();
  });

  it('opens straight into the list of all music', async () => {
    const { router } = await AllMusicWrapper.mount('/');

    expect(router.state.location.pathname).toBe('/library');
    expect(AllMusicWrapper.title).toHaveTextContent('All music');
  });

  it('offers All music in the sidebar instead of Library and History', async () => {
    await AllMusicWrapper.mount();

    expect(AllMusicWrapper.navigation.labels).toContain('All music');
    expect(AllMusicWrapper.navigation.labels).not.toContain('Library');
    expect(AllMusicWrapper.navigation.labels).not.toContain('History');
  });

  it('shows the empty state when there are no music folders', async () => {
    await AllMusicWrapper.mount();

    expect(AllMusicWrapper.emptyState).toBeInTheDocument();
  });

  it('lists the tracks of every folder', async () => {
    AllMusicWrapper.seedPlaylists(
      AllMusicWrapper.fixtures.folderPlaylistWithTracks(
        'Chill',
        '/music/chill',
        ['Teardrop', 'Angel'],
      ),
      AllMusicWrapper.fixtures.folderPlaylistWithTracks('Rock', '/music/rock', [
        'Paranoid Android',
      ]),
      AllMusicWrapper.fixtures.userPlaylist('Road trip'),
    );
    await AllMusicWrapper.mount();

    expect(await AllMusicWrapper.findTrack('Teardrop')).toBeVisible();
    expect(await AllMusicWrapper.findTrack('Angel')).toBeVisible();
    expect(await AllMusicWrapper.findTrack('Paranoid Android')).toBeVisible();
  });

  it('plays a track from the play button on its row', async () => {
    AllMusicWrapper.seedPlaylists(
      AllMusicWrapper.fixtures.folderPlaylistWithTracks(
        'Chill',
        '/music/chill',
        ['Teardrop', 'Angel'],
      ),
    );
    await AllMusicWrapper.mount();

    await AllMusicWrapper.playTrack('Angel');

    expect(AllMusicWrapper.queueTitles).toEqual(['Angel']);
  });

  it('plays local files picked with the open files button', async () => {
    PluginDialogMock.setOpenMany(LOOSE_AUDIO_FILES);
    commandMocks
      .command('readAudioTags')
      .mockResolvedValue(ok(LOOSE_AUDIO_FILE_TAGS));
    await AllMusicWrapper.mount();

    await AllMusicWrapper.openFilesButton.click();

    await vi.waitFor(() => {
      expect(AllMusicWrapper.queueTitles).toEqual(['Teardrop', 'Morning idea']);
    });
  });

  it('leaves the queue alone when no file is picked', async () => {
    PluginDialogMock.setOpenMany([]);
    await AllMusicWrapper.mount();

    await AllMusicWrapper.openFilesButton.click();

    expect(AllMusicWrapper.queueTitles).toEqual([]);
  });

  it('lists folders and user playlists in the sidebar', async () => {
    AllMusicWrapper.seedPlaylists(
      AllMusicWrapper.fixtures.userPlaylist('Road trip'),
      AllMusicWrapper.fixtures.folderPlaylist('Rock', 'C:/Music/Rock'),
    );

    await AllMusicWrapper.mount();

    expect(await AllMusicWrapper.sidebar.playlistNames()).toEqual([
      'Rock',
      'Road trip',
    ]);
  });

  it('turns a picked folder into a playlist in the sidebar', async () => {
    programChillFolder();

    await AllMusicWrapper.mount();
    await AllMusicWrapper.addFolderButton.click();

    expect(
      await AllMusicWrapper.sidebar.playlist('Chill').find(),
    ).toBeVisible();
    expect(await AllMusicWrapper.findTrack("La Femme d'Argent")).toBeVisible();
  });

  it('does not duplicate a folder that was already added', async () => {
    programChillFolder();

    await AllMusicWrapper.mount();
    await AllMusicWrapper.addFolderButton.click();
    await AllMusicWrapper.sidebar.playlist('Chill').find();
    await AllMusicWrapper.addFolderButton.click();

    expect(await AllMusicWrapper.sidebar.playlistNames()).toEqual(['Chill']);
  });

  it('turns every subfolder of a music library into its own playlist', async () => {
    programMusicLibrary();

    await AllMusicWrapper.mount();
    await AllMusicWrapper.addFolderButton.click();

    await AllMusicWrapper.sidebar.playlist('Mix - Tarzan Boy').find();
    expect(await AllMusicWrapper.sidebar.playlistNames()).toEqual([
      'Mix - Save Me',
      'Mix - Tarzan Boy',
    ]);
  });

  it('remembers the music library and adds new subfolders on the next start', async () => {
    programMusicLibrary();

    await AllMusicWrapper.mount();
    await AllMusicWrapper.addFolderButton.click();
    await AllMusicWrapper.sidebar.playlist('Mix - Tarzan Boy').find();

    commandMocks
      .command('resolveMusicFolders')
      .mockResolvedValue(ok(MUSIC_LIBRARY_SELECTION_WITH_NEW_FOLDER));
    await AllMusicWrapper.simulateRestart();

    await AllMusicWrapper.sidebar.playlist('Mix - Road Trip').find();
    expect(await AllMusicWrapper.sidebar.playlistNames()).toHaveLength(3);
  });

  it('loads the default music library on the first start', async () => {
    programMusicLibrary();

    await AllMusicWrapper.mount();
    await AllMusicWrapper.simulateRestart();

    await AllMusicWrapper.sidebar.playlist('Mix - Tarzan Boy').find();
    expect(await AllMusicWrapper.sidebar.playlistNames()).toEqual([
      'Mix - Save Me',
      'Mix - Tarzan Boy',
    ]);
  });

  it('keeps the empty state when the picked folder has no music', async () => {
    programMusicFolder({
      pickedPath: 'C:/Documents',
      selection: EMPTY_FOLDER_SELECTION,
      scans: {},
    });

    await AllMusicWrapper.mount();
    await AllMusicWrapper.addFolderButton.click();

    expect(AllMusicWrapper.emptyState).toBeInTheDocument();
  });

  it('names tracks from their tags, falling back to the file name', async () => {
    programChillFolder(CHILL_FOLDER_TAGS);

    await AllMusicWrapper.mount();
    await AllMusicWrapper.addFolderButton.click();
    await AllMusicWrapper.sidebar.playlist('Chill').click();

    expect(await AllMusicWrapper.openedPlaylist.findTitle()).toHaveTextContent(
      'Chill',
    );
    expect(
      await AllMusicWrapper.openedPlaylist.findTrack('Sunrise Session'),
    ).toBeInTheDocument();
    expect(
      await AllMusicWrapper.openedPlaylist.findTrack('Bonobo'),
    ).toBeInTheDocument();
    expect(
      await AllMusicWrapper.openedPlaylist.findTrack("La Femme d'Argent"),
    ).toBeInTheDocument();
    expect(
      await AllMusicWrapper.openedPlaylist.findTrack('Air'),
    ).toBeInTheDocument();
    expect(AllMusicWrapper.openedPlaylist.removeButtons).toHaveLength(0);
  });

  it('uses the cover embedded in the music files as the folder icon', async () => {
    programChillFolder(CHILL_FOLDER_TAGS);

    await AllMusicWrapper.mount();
    await AllMusicWrapper.addFolderButton.click();

    expect(
      await AllMusicWrapper.sidebar.playlist('Chill').findCover(),
    ).toHaveAttribute('src', 'asset://C:/AppData/covers/embedded/sunrise.jpg');
  });

  it('picks up new files in the folder when the playlist is opened', async () => {
    programChillFolder();
    commandMocks
      .command('scanMusicFolder')
      .mockResolvedValueOnce(ok(CHILL_FOLDER_SCAN))
      .mockResolvedValue(ok(CHILL_FOLDER_SCAN_WITH_NEW_FILE));

    await AllMusicWrapper.mount();
    await AllMusicWrapper.addFolderButton.click();
    await AllMusicWrapper.sidebar.playlist('Chill').click();

    expect(
      await AllMusicWrapper.openedPlaylist.findTrack('In the Waiting Line'),
    ).toBeInTheDocument();
  });

  it('picks up renamed files when refreshed', async () => {
    programChillFolder();

    await AllMusicWrapper.mount();
    await AllMusicWrapper.addFolderButton.click();
    expect(
      await AllMusicWrapper.findTrack("La Femme d'Argent"),
    ).toBeInTheDocument();

    commandMocks
      .command('scanMusicFolder')
      .mockResolvedValue(ok(CHILL_FOLDER_SCAN_WITH_RENAMED_FILE));
    await AllMusicWrapper.refreshButton.click();

    expect(await AllMusicWrapper.findTrack('Sexy Boy')).toBeInTheDocument();
    expect(AllMusicWrapper.hasTrack("La Femme d'Argent")).toBe(false);
  });

  it('adds new subfolders of the music library when refreshed', async () => {
    programMusicLibrary();

    await AllMusicWrapper.mount();
    await AllMusicWrapper.addFolderButton.click();
    await AllMusicWrapper.sidebar.playlist('Mix - Tarzan Boy').find();

    commandMocks
      .command('resolveMusicFolders')
      .mockResolvedValue(ok(MUSIC_LIBRARY_SELECTION_WITH_NEW_FOLDER));
    await AllMusicWrapper.refreshButton.click();

    expect(await AllMusicWrapper.findTrack('Africa')).toBeInTheDocument();
  });

  it('switches between light and dark mode from the sidebar', async () => {
    await AllMusicWrapper.mount();
    const startedDark = AllMusicWrapper.isDarkTheme;

    await AllMusicWrapper.themeToggle.click();
    await vi.waitFor(() => {
      expect(AllMusicWrapper.isDarkTheme).toBe(!startedDark);
    });

    await AllMusicWrapper.themeToggle.click();
    await vi.waitFor(() => {
      expect(AllMusicWrapper.isDarkTheme).toBe(startedDark);
    });
  });
});
