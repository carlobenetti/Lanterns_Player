import type { QueueItem } from '@nuclearplayer/model';

import { useQueueStore } from '../../stores/queueStore';
import { useSoundStore } from '../../stores/soundStore';
import { playbackManager } from '../playback';
import { AudioSourceFactory } from './audioSource';

export type ResolveOptions = {
  autoPlay: boolean;
  startPositionSeconds?: number;
};

export class StreamResolution {
  private activeItemId: string | null = null;

  constructor(private readonly audioSourceFactory = new AudioSourceFactory()) {}

  async resolve(item: QueueItem, options: ResolveOptions): Promise<void> {
    this.activeItemId = item.id;
    const { updateItemState } = useQueueStore.getState();

    if (options.autoPlay) {
      useSoundStore.getState().stop();
    }

    const localFile = item.track.localFile;
    if (!localFile) {
      updateItemState(item.id, {
        status: 'error',
        error: 'streaming:errors.notLocalFile',
      });
      return;
    }

    updateItemState(item.id, { status: 'loading', error: undefined });
    const audioSource = await this.audioSourceFactory.fromLocalFile(
      localFile.fileUri,
    );
    if (this.activeItemId !== item.id) {
      return;
    }

    if (options.startPositionSeconds !== undefined) {
      audioSource.startPositionSeconds = options.startPositionSeconds;
    }

    updateItemState(item.id, { status: 'success' });
    this.activeItemId = null;
    playbackManager.startTrack(item, audioSource, {
      autoPlay: options.autoPlay,
    });
  }
}

export const streamResolution = new StreamResolution();
