import { Music2 } from 'lucide-react';
import { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { pickArtwork } from '@nuclearplayer/model';
import { EmptyState } from '@nuclearplayer/ui';

import { ConnectedVolume } from '../../components/ConnectedPlayerBar/ConnectedVolume';
import { useQueue } from '../../hooks/useQueue';
import { NowPlayingControls } from './components/NowPlayingControls';
import { NowPlayingSeekBar } from './components/NowPlayingSeekBar';
import { SpectrumVisualizer } from './components/SpectrumVisualizer';

const COVER_SIZE_PX = 512;
const PLACEHOLDER_ICON_SIZE = 64;

export const NowPlaying: FC = () => {
  const { t } = useTranslation('nowPlaying');
  const { items, currentIndex } = useQueue();
  const track = items[currentIndex]?.track;

  if (!track) {
    return (
      <div
        data-testid="now-playing-view"
        className="surface-background flex h-full w-full items-center justify-center"
      >
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
      <div className="relative flex w-full flex-1 flex-col justify-center gap-8 overflow-y-auto px-10 py-8">
        <header className="flex items-center gap-8">
          <div className="border-border shadow-shadow bg-muted aspect-square w-[clamp(9rem,28vw,15rem)] shrink-0 overflow-hidden rounded-xl border-(length:--border-width)">
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

        <SpectrumVisualizer />

        <div className="flex flex-col gap-4">
          <NowPlayingSeekBar />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center">
            <span />
            <NowPlayingControls />
            <ConnectedVolume className="justify-self-end" />
          </div>
        </div>
      </div>
    </div>
  );
};
