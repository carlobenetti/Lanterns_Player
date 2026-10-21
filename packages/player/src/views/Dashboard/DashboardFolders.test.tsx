import type {
  LocalAudioTags,
  LocalFolderScan,
  MusicFolderSelection,
} from '../../services/tauri/bindings';
import { PlaylistBuilder } from '../../test/builders/PlaylistBuilder';
import {
  CHILL_FOLDER_PATH,
  CHILL_FOLDER_SCAN,
  CHILL_FOLDER_SCAN_WITH_NEW_FILE,
  CHILL_FOLDER_SELECTION,
  CHILL_FOLDER_TAGS,
  EMPTY_FOLDER_SELECTION,
  MUSIC_LIBRARY_PATH,
  MUSIC_LIBRARY_SCANS,
  MUSIC_LIBRARY_SELECTION,
  MUSIC_LIBRARY_SELECTION_WITH_NEW_FOLDER,
} from '../../test/fixtures/localFolders';
import { PluginDialogMock } from '../../test/mocks/plugin-dialog';
import { ok } from '../../test/utils/commandMocks';
import { DashboardWrapper } from './Dashboard.test-wrapper';

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

describe('Dashboard folders', () => {
  beforeEach(() => {
    DashboardWrapper.reset();
    DashboardWrapper.seedPlaylists();
    commandMocks.reset();
  });

  it('shows folder playlists instead of the empty state', async () => {
    DashboardWrapper.seedPlaylists(
      DashboardWrapper.fixtures.folderPlaylist('Rock', 'C:/Music/Rock'),
    );

    await DashboardWrapper.mount();

    expect(
      await DashboardWrapper.folders.folder('Rock').find(),
    ).toHaveTextContent('2 tracks');
    expect(DashboardWrapper.emptyState).not.toBeInTheDocument();
  });

  it('only lists playlists that come from folders', async () => {
    DashboardWrapper.seedPlaylists(
      DashboardWrapper.fixtures.folderPlaylist('Rock', 'C:/Music/Rock'),
      new PlaylistBuilder().withName('Gym'),
    );

    await DashboardWrapper.mount();

    expect(await DashboardWrapper.folders.cardNames()).toEqual(['Rock']);
  });

  it('turns a picked folder into a playlist on the dashboard', async () => {
    programChillFolder();

    await DashboardWrapper.mount();
    expect(DashboardWrapper.emptyState).toBeInTheDocument();

    await DashboardWrapper.addFolderButton.click();

    expect(
      await DashboardWrapper.folders.folder('Chill').find(),
    ).toHaveTextContent('2 tracks');
    expect(DashboardWrapper.emptyState).not.toBeInTheDocument();
  });

  it('does not duplicate a folder that was already added', async () => {
    programChillFolder();

    await DashboardWrapper.mount();
    await DashboardWrapper.addFolderButton.click();
    await DashboardWrapper.folders.folder('Chill').find();
    await DashboardWrapper.addFolderButton.click();

    expect(await DashboardWrapper.folders.cardNames()).toEqual(['Chill']);
  });

  it('turns every subfolder of a music library into its own playlist', async () => {
    programMusicLibrary();

    await DashboardWrapper.mount();
    await DashboardWrapper.addFolderButton.click();

    await DashboardWrapper.folders.folder('Mix - Tarzan Boy').find();
    expect(await DashboardWrapper.folders.cardNames()).toEqual([
      'Mix - Save Me',
      'Mix - Tarzan Boy',
    ]);
  });

  it('remembers the music library and adds new subfolders on the next start', async () => {
    programMusicLibrary();

    await DashboardWrapper.mount();
    await DashboardWrapper.addFolderButton.click();
    await DashboardWrapper.folders.folder('Mix - Tarzan Boy').find();

    commandMocks
      .command('resolveMusicFolders')
      .mockResolvedValue(ok(MUSIC_LIBRARY_SELECTION_WITH_NEW_FOLDER));
    await DashboardWrapper.simulateRestart();

    await DashboardWrapper.folders.folder('Mix - Road Trip').find();
    expect(await DashboardWrapper.folders.cardNames()).toHaveLength(3);
  });

  it('loads the default music library on the first start', async () => {
    programMusicLibrary();

    await DashboardWrapper.mount();
    await DashboardWrapper.simulateRestart();

    await DashboardWrapper.folders.folder('Mix - Tarzan Boy').find();
    expect(await DashboardWrapper.folders.cardNames()).toEqual([
      'Mix - Save Me',
      'Mix - Tarzan Boy',
    ]);
  });

  it('uses the Google Drive music folder as the default library on desktop', async () => {
    programMusicLibrary();

    await DashboardWrapper.mount();
    await DashboardWrapper.simulateRestart();

    expect(commandMocks.command('resolveMusicFolders')).toHaveBeenCalledWith(
      'G:\\Meu Drive\\Music',
    );
  });

  it('shows placeholder cards while the music library is loading', async () => {
    commandMocks
      .command('resolveMusicFolders')
      .mockReturnValue(new Promise(() => {}));

    await DashboardWrapper.mount();
    void DashboardWrapper.simulateRestart();

    expect(await DashboardWrapper.folders.findSkeleton()).toBeInTheDocument();
    expect(DashboardWrapper.emptyState).not.toBeInTheDocument();
  });

  it('shows the empty state when the picked folder has no music', async () => {
    programMusicFolder({
      pickedPath: 'C:/Documents',
      selection: EMPTY_FOLDER_SELECTION,
      scans: {},
    });

    await DashboardWrapper.mount();
    await DashboardWrapper.addFolderButton.click();

    expect(DashboardWrapper.emptyState).toBeInTheDocument();
  });

  it('names tracks from their tags, falling back to the file name', async () => {
    programChillFolder(CHILL_FOLDER_TAGS);

    await DashboardWrapper.mount();
    await DashboardWrapper.addFolderButton.click();
    await DashboardWrapper.folders.folder('Chill').click();

    expect(await DashboardWrapper.openedPlaylist.findTitle()).toHaveTextContent(
      'Chill',
    );
    expect(
      await DashboardWrapper.openedPlaylist.findTrack('Sunrise Session'),
    ).toBeInTheDocument();
    expect(
      await DashboardWrapper.openedPlaylist.findTrack('Bonobo'),
    ).toBeInTheDocument();
    expect(
      await DashboardWrapper.openedPlaylist.findTrack("La Femme d'Argent"),
    ).toBeInTheDocument();
    expect(
      await DashboardWrapper.openedPlaylist.findTrack('Air'),
    ).toBeInTheDocument();
    expect(DashboardWrapper.openedPlaylist.removeButtons).toHaveLength(0);
  });

  it('uses the cover embedded in the music files as the folder cover', async () => {
    programChillFolder(CHILL_FOLDER_TAGS);

    await DashboardWrapper.mount();
    await DashboardWrapper.addFolderButton.click();

    expect(
      await DashboardWrapper.folders.folder('Chill').findCover(),
    ).toHaveAttribute('src', 'asset://C:/AppData/covers/embedded/sunrise.jpg');
  });

  it('picks up new files in the folder when the playlist is opened', async () => {
    programChillFolder();
    commandMocks
      .command('scanMusicFolder')
      .mockResolvedValueOnce(ok(CHILL_FOLDER_SCAN))
      .mockResolvedValue(ok(CHILL_FOLDER_SCAN_WITH_NEW_FILE));

    await DashboardWrapper.mount();
    await DashboardWrapper.addFolderButton.click();
    await DashboardWrapper.folders.folder('Chill').click();

    expect(
      await DashboardWrapper.openedPlaylist.findTrack('In the Waiting Line'),
    ).toBeInTheDocument();
  });
});
