import { useRouterState } from '@tanstack/react-router';
import { FC, useEffect } from 'react';

import { RouteTransition } from '@nuclearplayer/ui';

import { usePlaylistStore } from '../../stores/playlistStore';
import { MobileHeader } from './MobileHeader';
import { MobileMiniPlayer } from './MobileMiniPlayer';
import { MobileTabBar } from './MobileTabBar';

const NOW_PLAYING_PATH = '/now-playing';

const useSyncLibraryWhenVisible = () => {
  useEffect(() => {
    const syncWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void usePlaylistStore.getState().syncLibraryRoots();
      }
    };
    document.addEventListener('visibilitychange', syncWhenVisible);
    return () =>
      document.removeEventListener('visibilitychange', syncWhenVisible);
  }, []);
};

export const MobileShell: FC = () => {
  const isNowPlaying = useRouterState({
    select: (state) => state.location.pathname === NOW_PLAYING_PATH,
  });
  useSyncLibraryWhenVisible();

  return (
    <div
      data-testid="mobile-shell"
      className="surface-background flex h-dvh w-screen flex-col overflow-hidden select-none"
      onContextMenu={(event) => event.preventDefault()}
    >
      <MobileHeader />
      <main className="relative min-h-0 flex-1">
        <RouteTransition variant="fade" />
      </main>
      {!isNowPlaying && <MobileMiniPlayer />}
      <MobileTabBar />
    </div>
  );
};
