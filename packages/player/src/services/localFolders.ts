import { convertFileSrc } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import isEmpty from 'lodash-es/isEmpty';

import type {
  ArtworkSet,
  PlaylistIndexEntry,
  ProviderRef,
  Track,
} from '@nuclearplayer/model';

import { Logger } from './logger';
import {
  commands,
  type LocalAudioFile,
  type LocalAudioTags,
  type LocalFolderScan,
  type MusicFolderSelection,
} from './tauri/bindings';

export const LOCAL_FOLDER_PROVIDER = 'local-folder';

const ARTIST_TITLE_SEPARATOR = ' - ';

const COVER_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'];

export const isFolderPlaylist = (
  playlist: Pick<PlaylistIndexEntry, 'origin'>,
): boolean => playlist.origin?.provider === LOCAL_FOLDER_PROVIDER;

export const folderOrigin = (folderPath: string): ProviderRef => ({
  provider: LOCAL_FOLDER_PROVIDER,
  id: folderPath,
});

export const localCoverArtwork = (imagePath: string): ArtworkSet => ({
  items: [{ url: convertFileSrc(imagePath), purpose: 'cover' }],
});

const ASSET_URL_PREFIXES = ['http://asset.localhost/', 'asset://localhost/'];

export const localPathFromAssetUrl = (url: string): string | null => {
  const prefix = ASSET_URL_PREFIXES.find((candidate) =>
    url.startsWith(candidate),
  );
  return prefix ? decodeURIComponent(url.slice(prefix.length)) : null;
};

const parseFileName = (fileName: string) => {
  const separatorIndex = fileName.indexOf(ARTIST_TITLE_SEPARATOR);
  if (separatorIndex <= 0) {
    return { title: fileName, artist: undefined };
  }

  return {
    artist: fileName.slice(0, separatorIndex).trim(),
    title: fileName
      .slice(separatorIndex + ARTIST_TITLE_SEPARATOR.length)
      .trim(),
  };
};

export const trackFromLocalFile = (
  file: LocalAudioFile,
  tags?: LocalAudioTags,
): Track => {
  const fromFileName = parseFileName(file.fileName);
  const title = tags?.title ?? fromFileName.title;
  const artist = tags?.artist ?? fromFileName.artist;

  return {
    title,
    artists: artist ? [{ name: artist, roles: ['main'] }] : [],
    ...(tags?.durationMs != null && { durationMs: tags.durationMs }),
    ...(tags?.trackNumber != null && { trackNumber: tags.trackNumber }),
    ...(tags?.coverPath && { artwork: localCoverArtwork(tags.coverPath) }),
    source: { provider: LOCAL_FOLDER_PROVIDER, id: file.path },
    localFile: {
      fileUri: file.path,
      format: file.extension,
      ...(tags && { scannedAtIso: new Date().toISOString() }),
    },
  };
};

export const pickMusicFolder = async (): Promise<string | null> => {
  const selected = await open({ directory: true, multiple: false });
  return typeof selected === 'string' ? selected : null;
};

export const pickCoverImage = async (): Promise<string | null> => {
  const selected = await open({
    multiple: false,
    filters: [{ name: 'Images', extensions: COVER_IMAGE_EXTENSIONS }],
  });
  return typeof selected === 'string' ? selected : null;
};

export const scanMusicFolder = async (
  folderPath: string,
): Promise<LocalFolderScan> => {
  const result = await commands.scanMusicFolder(folderPath);
  if (result.status === 'error') {
    throw new Error(result.error);
  }
  return result.data;
};

export const resolveMusicFolders = async (
  folderPath: string,
): Promise<MusicFolderSelection> => {
  const result = await commands.resolveMusicFolders(folderPath);
  if (result.status === 'error') {
    throw new Error(result.error);
  }
  return result.data;
};

export const readAudioTags = async (
  paths: string[],
): Promise<Map<string, LocalAudioTags>> => {
  if (isEmpty(paths)) {
    return new Map();
  }

  const result = await commands.readAudioTags(paths);
  if (result.status === 'error') {
    Logger.playlists.warn(`Could not read audio tags: ${result.error}`);
    return new Map();
  }
  return new Map(result.data.map((tags) => [tags.path, tags]));
};

export const saveCoverImage = async (
  playlistId: string,
  sourcePath: string,
): Promise<string> => {
  const result = await commands.savePlaylistCover(playlistId, sourcePath);
  if (result.status === 'error') {
    throw new Error(result.error);
  }
  return result.data;
};
