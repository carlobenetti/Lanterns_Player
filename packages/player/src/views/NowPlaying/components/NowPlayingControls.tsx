import {
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { Button, cn } from '@nuclearplayer/ui';

import { usePlaybackControls } from '../../../hooks/usePlaybackControls';

const SMALL_ICON_SIZE = 18;
const MAIN_ICON_SIZE = 28;

const toggleClasses = (isActive: boolean) =>
  cn('rounded-full opacity-60 hover:opacity-100', {
    'text-accent-green opacity-100': isActive,
  });

export const NowPlayingControls: FC = () => {
  const { t } = useTranslation('nowPlaying');
  const { t: tPlayerBar } = useTranslation('playerBar');
  const controls = usePlaybackControls();
  const repeatLabels = {
    off: tPlayerBar('repeatOff'),
    all: tPlayerBar('repeatAll'),
    one: tPlayerBar('repeatOne'),
  };

  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        size="icon"
        variant="text"
        className={toggleClasses(controls.isShuffleActive)}
        onClick={controls.toggleShuffle}
        aria-label={
          controls.isShuffleActive
            ? tPlayerBar('shuffleOn')
            : tPlayerBar('shuffleOff')
        }
        data-testid="now-playing-shuffle-button"
      >
        <Shuffle size={SMALL_ICON_SIZE} />
      </Button>
      <Button
        size="icon"
        variant="text"
        className="rounded-full"
        onClick={controls.goToPrevious}
        aria-label={t('previous')}
        data-testid="now-playing-previous-button"
      >
        <SkipBack size={SMALL_ICON_SIZE} fill="currentColor" />
      </Button>
      <Button
        size="flexible"
        className="size-16 justify-center rounded-full"
        onClick={controls.togglePlay}
        aria-label={controls.isPlaying ? t('pause') : t('play')}
        data-testid={
          controls.isPlaying
            ? 'now-playing-pause-button'
            : 'now-playing-play-button'
        }
      >
        {controls.isPlaying ? (
          <Pause size={MAIN_ICON_SIZE} fill="currentColor" />
        ) : (
          <Play size={MAIN_ICON_SIZE} fill="currentColor" className="ml-1" />
        )}
      </Button>
      <Button
        size="icon"
        variant="text"
        className="rounded-full"
        onClick={controls.goToNext}
        aria-label={t('next')}
        data-testid="now-playing-next-button"
      >
        <SkipForward size={SMALL_ICON_SIZE} fill="currentColor" />
      </Button>
      <Button
        size="icon"
        variant="text"
        className={toggleClasses(controls.repeatMode !== 'off')}
        onClick={controls.cycleRepeat}
        aria-label={repeatLabels[controls.repeatMode]}
        data-testid="now-playing-repeat-button"
      >
        {controls.repeatMode === 'one' ? (
          <Repeat1 size={SMALL_ICON_SIZE} />
        ) : (
          <Repeat size={SMALL_ICON_SIZE} />
        )}
      </Button>
    </div>
  );
};
