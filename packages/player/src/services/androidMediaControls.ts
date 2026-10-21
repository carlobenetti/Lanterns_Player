import isEqual from 'lodash-es/isEqual';
import omit from 'lodash-es/omit';

import { pickArtwork, type Track } from '@nuclearplayer/model';

import { useQueueStore } from '../stores/queueStore';
import { useSoundStore } from '../stores/soundStore';
import { localPathFromAssetUrl } from './localFolders';
import { playbackManager } from './playback';

const MS_PER_SECOND = 1000;
const SEEK_JUMP_SECONDS = 2;
const COVER_SIZE_PX = 512;

export type AndroidMediaAction =
  'play' | 'pause' | 'next' | 'previous' | 'seek';

export type AndroidMediaState = {
  hasTrack: boolean;
  title: string;
  artist: string;
  coverPath: string | null;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
};

type AndroidMediaBridge = {
  update: (stateJson: string) => void;
};

declare global {
  interface Window {
    LanternsMedia?: AndroidMediaBridge;
    __lanternsMediaAction?: (
      action: AndroidMediaAction,
      value?: number,
    ) => void;
  }
}

const coverPathOf = (track?: Track): string | null => {
  const url = pickArtwork(track?.artwork, 'cover', COVER_SIZE_PX)?.url;
  return url ? localPathFromAssetUrl(url) : null;
};

const currentState = (): AndroidMediaState => {
  const track = useQueueStore.getState().getCurrentItem()?.track;
  const { status, seek, duration } = useSoundStore.getState();
  const durationSeconds = duration > 0 ? duration : 0;

  return {
    hasTrack: Boolean(track),
    title: track?.title ?? '',
    artist: track?.artists.map(({ name }) => name).join(', ') ?? '',
    coverPath: coverPathOf(track),
    isPlaying: status === 'playing',
    positionMs: Math.round((Number.isFinite(seek) ? seek : 0) * MS_PER_SECOND),
    durationMs: Math.round(
      durationSeconds * MS_PER_SECOND || (track?.durationMs ?? 0),
    ),
  };
};

const handleAction = (action: AndroidMediaAction, value?: number) => {
  switch (action) {
    case 'play':
      playbackManager.play();
      return;
    case 'pause':
      playbackManager.pause();
      return;
    case 'next':
      useQueueStore.getState().goToNext();
      return;
    case 'previous':
      useQueueStore.getState().goToPrevious();
      return;
    case 'seek':
      if (value !== undefined) {
        useSoundStore.getState().seekTo(value / MS_PER_SECOND);
      }
      return;
  }
};

const withoutPosition = (state: AndroidMediaState) => omit(state, 'positionMs');

export const initAndroidMediaControls = (): (() => void) => {
  const bridge = window.LanternsMedia;
  if (!bridge) {
    return () => {};
  }

  let lastSent: AndroidMediaState | null = null;
  let lastSentAt = 0;

  const expectedPositionMs = (sent: AndroidMediaState) =>
    sent.isPlaying
      ? sent.positionMs + (Date.now() - lastSentAt)
      : sent.positionMs;

  const sync = () => {
    const state = currentState();
    const isSameSong =
      lastSent !== null &&
      isEqual(withoutPosition(state), withoutPosition(lastSent));
    const jumped =
      lastSent !== null &&
      Math.abs(state.positionMs - expectedPositionMs(lastSent)) >
        SEEK_JUMP_SECONDS * MS_PER_SECOND;
    if (isSameSong && !jumped) {
      return;
    }

    lastSent = state;
    lastSentAt = Date.now();
    bridge.update(JSON.stringify(state));
  };

  window.__lanternsMediaAction = handleAction;
  const unsubscribeQueue = useQueueStore.subscribe(sync);
  const unsubscribeSound = useSoundStore.subscribe(sync);
  sync();

  return () => {
    unsubscribeQueue();
    unsubscribeSound();
    delete window.__lanternsMediaAction;
  };
};
