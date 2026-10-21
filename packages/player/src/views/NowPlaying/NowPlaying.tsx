import { Maximize2, Minimize2, Music2 } from 'lucide-react';
import { FC, useEffect } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { pickArtwork } from '@nuclearplayer/model';
import { Button, cn, EmptyState } from '@nuclearplayer/ui';

import { ConnectedVolume } from '../../components/ConnectedPlayerBar/ConnectedVolume';
import { useQueue } from '../../hooks/useQueue';
import { isMobilePlatform } from '../../services/platform';
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

type StageProps = {
  coverUrl?: string;
  title: string;
  artist: string;
};

const CompactStage: FC<StageProps> = ({ coverUrl, title, artist }) => {
  const { t } = useTranslation('nowPlaying');

  return (
    <div
      data-testid="now-playing-compact"
      className="relative flex h-full w-full flex-col items-center justify-center gap-6 px-6 py-6"
    >
      <LanternCover coverUrl={coverUrl} className="w-[min(78vw,42dvh)]" />
      <div className="flex w-full min-w-0 flex-col items-center gap-1 text-center">
        <span className="text-xs font-bold tracking-[0.25em] uppercase opacity-60">
          {t('label')}
        </span>
        <h1
          data-testid="now-playing-stage-title"
          className="font-heading line-clamp-2 text-2xl leading-tight font-extrabold"
        >
          {title}
        </h1>
        <p
          data-testid="now-playing-stage-artist"
          className="w-full truncate opacity-80"
        >
          {artist}
        </p>
      </div>
      <div className="flex w-full flex-col gap-4">
        <NowPlayingSeekBar />
        <NowPlayingControls />
      </div>
    </div>
  );
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

  if (isMobilePlatform()) {
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
            className="pointer-events-none absolute inset-0 size-full scale-125 object-cover opacity-15 blur-2xl select-none"
          />
        )}
        <CompactStage coverUrl={coverUrl} title={track.title} artist={artist} />
      </div>
    );
  }

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
      <StarfieldBackground />

      {isFullscreen ? (
        <div
          data-testid="now-playing-fullscreen"
          className="relative flex h-full w-full flex-col items-center gap-6 px-10 pt-12 pb-8"
        >
          <FullscreenButton className="absolute top-4 right-4" />
          <LanternCover
            coverUrl={coverUrl}
            className="w-[clamp(9rem,34vh,24rem)]"
          />
          <div className="flex max-w-xl min-w-0 flex-col items-center gap-1 text-center">
            <p
              data-testid="now-playing-stage-title"
              className="font-heading w-full truncate text-lg font-bold"
            >
              {track.title}
            </p>
            <p
              data-testid="now-playing-stage-artist"
              className="w-full truncate text-sm opacity-60"
            >
              {artist}
            </p>
          </div>
          <SpectrumVisualizer className="min-h-48 flex-1" />
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

          <SpectrumVisualizer className="min-h-40 flex-1" />

          <div className="flex shrink-0 flex-col gap-4">
            <NowPlayingSeekBar />
            <div className="grid grid-cols-[1fr_auto_1fr] items-center">
              <FullscreenButton className="justify-self-start" />
              <NowPlayingControls />
              <ConnectedVolume className="justify-self-end" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
