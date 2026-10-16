import { FC, KeyboardEvent, MouseEvent, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useTranslation } from '@nuclearplayer/i18n';
import { formatTimeSeconds } from '@nuclearplayer/ui';

import { useSoundStore } from '../../../stores/soundStore';

const KEYBOARD_SEEK_STEP_SECONDS = 5;

const finiteOrZero = (value: number) => (Number.isFinite(value) ? value : 0);

export const NowPlayingSeekBar: FC = () => {
  const { t } = useTranslation('nowPlaying');
  const trackRef = useRef<HTMLDivElement>(null);
  const { seek, duration, seekTo } = useSoundStore(
    useShallow((state) => ({
      seek: state.seek,
      duration: state.duration,
      seekTo: state.seekTo,
    })),
  );

  const position = finiteOrZero(seek);
  const total = finiteOrZero(duration);
  const percent = total > 0 ? Math.min(100, (position / total) * 100) : 0;

  const seekToSeconds = (seconds: number) => {
    if (total > 0) {
      seekTo(Math.max(0, Math.min(total, seconds)));
    }
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    const rect = track.getBoundingClientRect();
    seekToSeconds(((event.clientX - rect.left) / rect.width) * total);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      seekToSeconds(position + KEYBOARD_SEEK_STEP_SECONDS);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      seekToSeconds(position - KEYBOARD_SEEK_STEP_SECONDS);
    }
  };

  return (
    <div className="flex w-full flex-col gap-2 select-none">
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={t('seek')}
        aria-valuemin={0}
        aria-valuemax={Math.round(total)}
        aria-valuenow={Math.round(position)}
        aria-valuetext={formatTimeSeconds(position)}
        data-testid="now-playing-seek-bar"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="group relative flex h-4 cursor-pointer items-center outline-none"
      >
        <div className="bg-muted border-border relative h-2 w-full overflow-hidden rounded-full border-(length:--border-width)">
          <div
            className="from-accent-green to-accent-cyan h-full bg-linear-to-r"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div
          className="bg-foreground border-border group-focus-visible:ring-primary absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-(length:--border-width) transition-transform group-hover:scale-125 group-focus-visible:ring-2"
          style={{ left: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between text-xs tabular-nums opacity-70">
        <span data-testid="now-playing-elapsed">
          {formatTimeSeconds(position)}
        </span>
        <span data-testid="now-playing-total">{formatTimeSeconds(total)}</span>
      </div>
    </div>
  );
};
