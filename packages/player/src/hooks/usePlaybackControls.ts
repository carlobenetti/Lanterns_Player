import { useShallow } from 'zustand/react/shallow';

import { RepeatMode } from '@nuclearplayer/plugin-sdk';

import { playbackManager } from '../services/playback';
import { useQueueStore } from '../stores/queueStore';
import { useSoundStore } from '../stores/soundStore';
import { useCoreSetting } from './useCoreSetting';

const REPEAT_MODES: Array<RepeatMode> = ['off', 'all', 'one'];

export const usePlaybackControls = () => {
  const [shuffleEnabled, setShuffleEnabled] =
    useCoreSetting<boolean>('playback.shuffle');
  const [repeatMode, setRepeatMode] =
    useCoreSetting<RepeatMode>('playback.repeat');
  const { goToNext, goToPrevious } = useQueueStore(
    useShallow((state) => ({
      goToNext: state.goToNext,
      goToPrevious: state.goToPrevious,
    })),
  );
  const status = useSoundStore((state) => state.status);

  const toggleShuffle = () => {
    setShuffleEnabled(!shuffleEnabled);
  };

  const cycleRepeat = () => {
    const currentIndex = REPEAT_MODES.indexOf(repeatMode ?? 'off');
    const nextIndex = (currentIndex + 1) % REPEAT_MODES.length;
    setRepeatMode(REPEAT_MODES[nextIndex]);
  };

  return {
    isPlaying: status === 'playing',
    isShuffleActive: Boolean(shuffleEnabled),
    repeatMode: repeatMode ?? 'off',
    togglePlay: playbackManager.toggle,
    goToNext,
    goToPrevious,
    toggleShuffle,
    cycleRepeat,
  };
};
