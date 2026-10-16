import type { FC, PropsWithChildren } from 'react';
import { useCallback, useEffect } from 'react';

import { Sound } from '@nuclearplayer/hifi';

import { useCoreSetting } from '../hooks/useCoreSetting';
import { audioAnalyser } from '../services/audioAnalyser';
import { Logger } from '../services/logger';
import { playbackManager } from '../services/playback';
import { useQueueStore } from '../stores/queueStore';
import { useSoundStore } from '../stores/soundStore';
import { errorMessage } from '../utils/errorMessage';

export const SoundProvider: FC<PropsWithChildren> = ({ children }) => {
  const { src, status, seek } = useSoundStore();
  const preload: HTMLAudioElement['preload'] = 'auto';
  const crossOrigin = '' as const;
  const [volume01] = useCoreSetting<number>('playback.volume');
  const [muted] = useCoreSetting<boolean>('playback.muted');
  const volumePercent = muted ? 0 : Math.round((volume01 ?? 1) * 100);

  useEffect(() => {
    if (status === 'playing') {
      audioAnalyser.resume();
    }
  }, [status]);

  const handleTimeUpdate = useCallback(
    ({ position, duration }: { position: number; duration: number }) => {
      useSoundStore.getState().updatePlayback(position, duration);
    },
    [],
  );

  const handleEnd = useCallback(() => {
    playbackManager.finishTrack();
  }, []);

  const handleCanPlay = useCallback(() => {
    const currentItem = useQueueStore.getState().getCurrentItem();
    if (currentItem) {
      useQueueStore
        .getState()
        .updateItemState(currentItem.id, { status: 'success' });
    }
  }, []);

  const handleError = useCallback((error: Error) => {
    const message = errorMessage(error);
    Logger.streaming.error(`Playback error: ${message}`);

    const currentItem = useQueueStore.getState().getCurrentItem();
    if (currentItem) {
      useQueueStore
        .getState()
        .updateItemState(currentItem.id, { status: 'error', error: message });
    }
  }, []);

  return (
    <>
      {src && (
        <Sound
          src={src}
          status={status}
          seek={seek}
          volume={volumePercent}
          preload={preload}
          crossOrigin={crossOrigin}
          onTimeUpdate={handleTimeUpdate}
          onEnd={handleEnd}
          onCanPlay={handleCanPlay}
          onError={handleError}
          onAudioElement={audioAnalyser.attach}
        />
      )}
      {children}
    </>
  );
};
