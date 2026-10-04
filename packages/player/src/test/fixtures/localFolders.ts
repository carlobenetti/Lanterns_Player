import type {
  LocalAudioTags,
  LocalFolderScan,
  MusicFolderSelection,
} from '../../services/tauri/bindings';

export const CHILL_FOLDER_PATH = 'C:/Music/Chill';

export const CHILL_FOLDER_SCAN: LocalFolderScan = {
  folderPath: CHILL_FOLDER_PATH,
  folderName: 'Chill',
  coverPath: null,
  files: [
    {
      path: `${CHILL_FOLDER_PATH}/Air - La Femme d'Argent.mp3`,
      fileName: "Air - La Femme d'Argent",
      extension: 'mp3',
    },
    {
      path: `${CHILL_FOLDER_PATH}/Untitled Demo.mp4`,
      fileName: 'Untitled Demo',
      extension: 'mp4',
    },
  ],
};

export const CHILL_FOLDER_SCAN_WITH_NEW_FILE: LocalFolderScan = {
  ...CHILL_FOLDER_SCAN,
  files: [
    ...CHILL_FOLDER_SCAN.files,
    {
      path: `${CHILL_FOLDER_PATH}/Zero 7 - In the Waiting Line.flac`,
      fileName: 'Zero 7 - In the Waiting Line',
      extension: 'flac',
    },
  ],
};

export const CHILL_FOLDER_SELECTION: MusicFolderSelection = {
  isLibrary: false,
  folders: [CHILL_FOLDER_PATH],
};

export const CHILL_FOLDER_TAGS: LocalAudioTags[] = [
  {
    path: `${CHILL_FOLDER_PATH}/Untitled Demo.mp4`,
    title: 'Sunrise Session',
    artist: 'Bonobo',
    trackNumber: 2,
    durationMs: 245000,
    coverPath: 'C:/AppData/covers/embedded/sunrise.jpg',
  },
];

export const MUSIC_LIBRARY_PATH = 'G:/Meu Drive/Music';

const SAVE_ME_PATH = `${MUSIC_LIBRARY_PATH}/Mix - Save Me`;
const TARZAN_BOY_PATH = `${MUSIC_LIBRARY_PATH}/Mix - Tarzan Boy`;
const NEW_MIX_PATH = `${MUSIC_LIBRARY_PATH}/Mix - Road Trip`;

export const MUSIC_LIBRARY_SELECTION: MusicFolderSelection = {
  isLibrary: true,
  folders: [SAVE_ME_PATH, TARZAN_BOY_PATH],
};

export const MUSIC_LIBRARY_SELECTION_WITH_NEW_FOLDER: MusicFolderSelection = {
  isLibrary: true,
  folders: [NEW_MIX_PATH, SAVE_ME_PATH, TARZAN_BOY_PATH],
};

export const MUSIC_LIBRARY_SCANS: Record<string, LocalFolderScan> = {
  [SAVE_ME_PATH]: {
    folderPath: SAVE_ME_PATH,
    folderName: 'Mix - Save Me',
    coverPath: null,
    files: [
      {
        path: `${SAVE_ME_PATH}/Coldplay - The Scientist.mp3`,
        fileName: 'Coldplay - The Scientist',
        extension: 'mp3',
      },
    ],
  },
  [TARZAN_BOY_PATH]: {
    folderPath: TARZAN_BOY_PATH,
    folderName: 'Mix - Tarzan Boy',
    coverPath: null,
    files: [
      {
        path: `${TARZAN_BOY_PATH}/4 Non Blondes - What's Up.mp3`,
        fileName: "4 Non Blondes - What's Up",
        extension: 'mp3',
      },
    ],
  },
  [NEW_MIX_PATH]: {
    folderPath: NEW_MIX_PATH,
    folderName: 'Mix - Road Trip',
    coverPath: null,
    files: [
      {
        path: `${NEW_MIX_PATH}/Toto - Africa.mp3`,
        fileName: 'Toto - Africa',
        extension: 'mp3',
      },
    ],
  },
};

export const EMPTY_FOLDER_SELECTION: MusicFolderSelection = {
  isLibrary: true,
  folders: [],
};
