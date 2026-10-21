import { useNavigate } from '@tanstack/react-router';
import { Music2, Pause, Play, SkipForward } from 'lucide-react';
import { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { pickArtwork } from '@nuclearplayer/model';
import { Button } from '@nuclearplayer/ui';

import { usePlaybackControls } from '../../hooks/usePlaybackControls';
import { useQueueStore } from '../../stores/queueStore';
import { useSoundStore } from '../../stores/soundStore';

const COVER_SIZE_PX = 48;
const ICON_SIZE = 22;
const FULL_PERCENT = 100;

const MiniPlayerProgress: FC = () => {
  const percent = useSoundStore((state) =>
    state.duration > 0 && Number.isFinite(state.seek)
      ? Math.min(FULL_PERCENT, (state.seek / state.duration) * FULL_PERCENT)
      : 0,
  );

  return (
    <div className="bg-muted absolute inset-x-0 top-0 h-0.5">
      <div
        className="bg-accent-green h-full"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

export const MobileMiniPlayer: FC = () => {
  const { t } = useTranslation('nowPlaying');
  const navigate = useNavigate();
  const track = useQueueStore((state) => state.getCurrentItem()?.track);
  const controls = usePlaybackControls();

  if (!track) {
    return null;
  }

  const coverUrl = pickArtwork(track.artwork, 'thumbnail', COVER_SIZE_PX)?.url;
  const artist = track.artists.map(({ name }) => name).join(', ');

  return (
    <div
      data-testid="mobile-mini-player"
      className="surface-card border-border relative flex shrink-0 items-center gap-2 border-t-(length:--border-width) py-2 pr-2 pl-3"
    >
      <MiniPlayerProgress />
      <button
        type="button"
        onClick={() => navigate({ to: '/now-playing' })}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div className="bg-muted border-border flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md border-(length:--border-width)">
          {coverUrl ? (
            <img src={coverUrl} alt="" className="size-full object-cover" />
          ) : (
            <Music2 size={ICON_SIZE} className="opacity-60" />
          )}
        </div>
        <div className="flex min-w-0 flex-col">
          <span
            data-testid="mobile-mini-player-title"
            className="truncate text-sm font-bold"
          >
            {track.title}
          </span>
          <span
            data-testid="mobile-mini-player-artist"
            className="truncate text-xs opacity-70"
          >
            {artist}
          </span>
        </div>
      </button>
      <Button
        size="icon"
        className="rounded-full"
        data-testid="mobile-mini-player-play-pause"
        aria-label={controls.isPlaying ? t('pause') : t('play')}
        onClick={controls.togglePlay}
      >
        {controls.isPlaying ? (
          <Pause size={ICON_SIZE} fill="currentColor" />
        ) : (
          <Play size={ICON_SIZE} fill="currentColor" />
        )}
      </Button>
      <Button
        size="icon"
        variant="text"
        aria-label={t('next')}
        onClick={controls.goToNext}
      >
        <SkipForward size={ICON_SIZE} fill="currentColor" />
      </Button>
    </div>
  );
};
