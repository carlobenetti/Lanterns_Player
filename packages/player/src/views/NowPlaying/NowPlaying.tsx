import { ListMusic, Maximize2, Minimize2, Music2 } from 'lucide-react';
import { FC, ReactNode, useEffect } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { pickArtwork } from '@nuclearplayer/model';
import { Button, cn, EmptyState } from '@nuclearplayer/ui';

import { ConnectedVolume } from '../../components/ConnectedPlayerBar/ConnectedVolume';
import { useQueue } from '../../hooks/useQueue';
import { useFullscreenStore } from '../../stores/fullscreenStore';
import { NowPlayingControls } from './components/NowPlayingControls';
import { NowPlayingSeekBar } from './components/NowPlayingSeekBar';
import { SpectrumVisualizer } from './components/SpectrumVisualizer';
import {
  LANTERN_ENERGY_VARIABLE,
  StarfieldBackground,
} from './components/StarfieldBackground';

const COVER_SIZE_PX = 512;
const PLACEHOLDER_ICON_SIZE = 64;
const FULLSCREEN_ICON_SIZE = 18;
const LANTERN_GLOW_BASE_OPACITY = 0.15;
const LANTERN_GLOW_ENERGY_OPACITY = 1.2;
const QUEUE_ICON_SIZE = 18;
const FULLSCREEN_PLANET_RADIUS_RATIO = 0.15;

const LanternCover: FC<{ coverUrl?: string; className?: string }> = ({
  coverUrl,
  className,
}) => (
  <div className={cn('relative aspect-square shrink-0', className)}>
    <div
      aria-hidden
      className="bg-accent-green pointer-events-none absolute -inset-6 rounded-[2rem] blur-3xl"
      style={{
        opacity: `calc(${LANTERN_GLOW_BASE_OPACITY} + var(${LANTERN_ENERGY_VARIABLE}, 0) * ${LANTERN_GLOW_ENERGY_OPACITY})`,
      }}
    />
    <div className="border-border shadow-shadow bg-muted relative size-full overflow-hidden rounded-xl border-(length:--border-width)">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt=""
          data-testid="now-playing-stage-cover"
          className="size-full object-cover select-none"
        />
      ) : (
        <div
          data-testid="now-playing-stage-cover-placeholder"
          className="text-muted-foreground flex size-full items-center justify-center"
        >
          <Music2 size={PLACEHOLDER_ICON_SIZE} />
        </div>
      )}
    </div>
  </div>
);

const FullscreenButton: FC<{ className?: string }> = ({ className }) => {
  const { t } = useTranslation('nowPlaying');
  const isFullscreen = useFullscreenStore((state) => state.isFullscreen);
  const enter = useFullscreenStore((state) => state.enter);
  const exit = useFullscreenStore((state) => state.exit);

  return (
    <Button
      size="icon"
      variant="text"
      className={cn('rounded-full opacity-60 hover:opacity-100', className)}
      onClick={isFullscreen ? exit : enter}
      aria-label={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
      data-testid={
        isFullscreen
          ? 'now-playing-exit-fullscreen-button'
          : 'now-playing-fullscreen-button'
      }
    >
      {isFullscreen ? (
        <Minimize2 size={FULLSCREEN_ICON_SIZE} />
      ) : (
        <Maximize2 size={FULLSCREEN_ICON_SIZE} />
      )}
    </Button>
  );
};

const FullscreenQueueButton: FC = () => {
  const { t } = useTranslation('nowPlaying');
  const isQueueOpen = useFullscreenStore((state) => state.isQueueOpen);
  const toggleQueue = useFullscreenStore((state) => state.toggleQueue);

  return (
    <Button
      size="icon"
      variant="text"
      className="rounded-full opacity-25 transition-opacity hover:opacity-100 focus-visible:opacity-100"
      onClick={toggleQueue}
      aria-label={isQueueOpen ? t('hideQueue') : t('showQueue')}
      aria-pressed={isQueueOpen}
      data-testid="now-playing-queue-toggle"
    >
      <ListMusic size={QUEUE_ICON_SIZE} />
    </Button>
  );
};

const PlaybackPanel: FC<{ leading?: ReactNode }> = ({ leading }) => (
  <div className="relative flex shrink-0 flex-col gap-4">
    <NowPlayingSeekBar />
    <div className="grid grid-cols-[1fr_auto_1fr] items-center">
      <div className="justify-self-start">{leading}</div>
      <NowPlayingControls />
      <ConnectedVolume className="justify-self-end" />
    </div>
  </div>
);

const useExitFullscreenOnEscape = (isFullscreen: boolean) => {
  const exit = useFullscreenStore((state) => state.exit);

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        exit();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen, exit]);
};

export const NowPlaying: FC = () => {
  const { t } = useTranslation('nowPlaying');
  const { items, currentIndex } = useQueue();
  const isFullscreen = useFullscreenStore((state) => state.isFullscreen);
  const track = items[currentIndex]?.track;
  useExitFullscreenOnEscape(isFullscreen);

  if (!track) {
    return (
      <div
        data-testid="now-playing-view"
        className="surface-background relative flex h-full w-full items-center justify-center"
      >
        {isFullscreen && (
          <FullscreenButton className="absolute top-4 right-4" />
        )}
        <EmptyState
          data-testid="now-playing-empty"
          icon={<Music2 size={PLACEHOLDER_ICON_SIZE} />}
          title={t('empty.title')}
          description={t('empty.description')}
        />
      </div>
    );
  }

  const coverUrl = pickArtwork(track.artwork, 'cover', COVER_SIZE_PX)?.url;
  const artist = track.artists.map(({ name }) => name).join(', ');
  const details = [
    track.album?.title,
    t('trackPosition', { current: currentIndex + 1, total: items.length }),
  ].filter(Boolean);

  return (
    <div
      data-testid="now-playing-view"
      className="surface-background relative flex h-full w-full overflow-hidden"
    >
      {coverUrl && (
        <img
          src={coverUrl}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full scale-125 object-cover opacity-15 blur-3xl select-none"
        />
      )}
      <StarfieldBackground
        planetRadiusRatio={
          isFullscreen ? FULLSCREEN_PLANET_RADIUS_RATIO : undefined
        }
      />

      {isFullscreen ? (
        <div
          data-testid="now-playing-fullscreen"
          className="relative flex h-full w-full flex-col justify-end gap-4 px-10 pb-8"
        >
          <div className="absolute top-8 left-10 flex w-[clamp(7rem,13vw,11rem)] flex-col gap-3">
            <LanternCover coverUrl={coverUrl} className="w-full" />
            <div className="flex min-w-0 flex-col gap-1">
              <p
                data-testid="now-playing-stage-title"
                className="font-heading line-clamp-2 text-base leading-tight font-bold"
              >
                {track.title}
              </p>
              <p
                data-testid="now-playing-stage-artist"
                className="truncate text-sm opacity-60"
              >
                {artist}
              </p>
            </div>
          </div>
          <div className="absolute top-4 right-4 flex items-center gap-1">
            <FullscreenQueueButton />
            <FullscreenButton />
          </div>
          <div className="pointer-events-none h-[40%] shrink-0">
            <SpectrumVisualizer className="h-full" />
          </div>
          <PlaybackPanel />
        </div>
      ) : (
        <div className="relative flex h-full w-full flex-col gap-6 px-10 py-8">
          <header className="flex shrink-0 items-center gap-8">
            <LanternCover
              coverUrl={coverUrl}
              className="w-[clamp(8rem,min(26vw,30vh),15rem)]"
            />
            <div className="flex min-w-0 flex-col gap-2">
              <span className="text-accent-green text-xs font-bold tracking-[0.25em] uppercase">
                {t('label')}
              </span>
              <h1
                data-testid="now-playing-stage-title"
                className="font-heading line-clamp-2 text-[clamp(1.75rem,4vw,3.5rem)] leading-none font-extrabold"
              >
                {track.title}
              </h1>
              <p
                data-testid="now-playing-stage-artist"
                className="truncate text-lg opacity-80"
              >
                {artist}
              </p>
              <p
                data-testid="now-playing-stage-details"
                className="truncate text-sm opacity-60"
              >
                {details.join(' · ')}
              </p>
            </div>
          </header>

          <SpectrumVisualizer className="pointer-events-none min-h-40 flex-1 translate-y-[20%]" />

          <PlaybackPanel leading={<FullscreenButton />} />
        </div>
      )}
    </div>
  );
};
