import { createRootRoute, useRouterState } from '@tanstack/react-router';
import { getCurrentWindow } from '@tauri-apps/api/window';
import {
  AudioLinesIcon,
  LibraryBigIcon,
  MusicIcon,
  SettingsIcon,
} from 'lucide-react';
import { useEffect } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import {
  PlayerShell,
  PlayerWorkspace,
  RouteTransition,
  SidebarNavigation,
  SidebarNavigationItem,
  Toaster,
} from '@nuclearplayer/ui';

import { AddFolderButton } from '../components/AddFolderButton';
import { ConnectedPlayerBar } from '../components/ConnectedPlayerBar';
import {
  ConnectedQueuePanel,
  QueueHeaderActions,
} from '../components/ConnectedQueuePanel';
import { ConnectedSettingsModal } from '../components/ConnectedSettingsModal';
import { ConnectedThemeController } from '../components/ConnectedThemeController';
import { ConnectedTitleBar } from '../components/ConnectedTitleBar';
import { FlatpakWarningBanner } from '../components/FlatpakWarningBanner';
import { SidebarPlaylists } from '../components/SidebarPlaylists';
import { SoundProvider } from '../components/SoundProvider';
import { StreamResolver } from '../components/StreamResolver';
import { useFramelessWindow } from '../hooks/useFramelessWindow';
import { GlobalShortcuts } from '../shortcuts';
import { useFullscreenStore } from '../stores/fullscreenStore';
import { useLayoutStore } from '../stores/layoutStore';
import { useSettingsModalStore } from '../stores/settingsModalStore';

const NOW_PLAYING_PATH = '/now-playing';
const SIDEBAR_PEEK_DELAY_MS = 1000;

const RootComponent = () => {
  const { t } = useTranslation('navigation');
  const { t: tPrefs } = useTranslation('preferences');
  const {
    leftSidebar,
    rightSidebar,
    toggleLeftSidebar,
    toggleRightSidebar,
    setLeftSidebarWidth,
    setRightSidebarWidth,
  } = useLayoutStore();
  const openSettings = useSettingsModalStore((state) => state.open);
  const isNowPlaying = useRouterState({
    select: (state) => state.location.pathname === NOW_PLAYING_PATH,
  });
  const isFullscreen = useFullscreenStore((state) => state.isFullscreen);
  useFramelessWindow();
  const exitFullscreen = useFullscreenStore((state) => state.exit);
  const isFullscreenQueueOpen = useFullscreenStore(
    (state) => state.isQueueOpen,
  );
  const toggleFullscreenQueue = useFullscreenStore(
    (state) => state.toggleQueue,
  );
  const isQueueVisible = !isFullscreen || isFullscreenQueueOpen;
  const isQueueCollapsed = isFullscreen ? false : rightSidebar.isCollapsed;
  useEffect(() => {
    const window = getCurrentWindow();
    window.show().then(() => window.setFocus());
  }, []);
  useEffect(() => {
    if (!isNowPlaying) {
      exitFullscreen();
    }
  }, [isNowPlaying, exitFullscreen]);
  return (
    <PlayerShell onContextMenu={(e) => e.preventDefault()}>
      <GlobalShortcuts />
      <div>
        {!isFullscreen && <ConnectedTitleBar />}
        <FlatpakWarningBanner />
      </div>
      <StreamResolver />
      <SoundProvider>
        <PlayerWorkspace>
          {!isFullscreen && (
            <PlayerWorkspace.LeftSidebar
              width={leftSidebar.width}
              isCollapsed={leftSidebar.isCollapsed}
              onWidthChange={setLeftSidebarWidth}
              onToggle={toggleLeftSidebar}
              peekDelayMs={SIDEBAR_PEEK_DELAY_MS}
            >
              {({ isCompact }) => (
                <SidebarNavigation isCompact={isCompact}>
                  <div className="flex flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto">
                    <AddFolderButton />
                    <ConnectedThemeController />
                    <div className="border-border my-1 border-t-(length:--border-width)" />
                    <SidebarNavigationItem
                      to="/now-playing"
                      icon={<AudioLinesIcon />}
                      label={t('nowPlaying')}
                    />
                    <SidebarNavigationItem
                      to="/library"
                      icon={<LibraryBigIcon />}
                      label={t('allMusic')}
                    />
                    <SidebarNavigationItem
                      to="/favorites/tracks"
                      icon={<MusicIcon />}
                      label={t('favoriteTracks')}
                    />
                    <SidebarPlaylists />
                  </div>
                  <SidebarNavigationItem
                    icon={<SettingsIcon />}
                    label={tPrefs('title')}
                    onClick={() => openSettings()}
                  />
                </SidebarNavigation>
              )}
            </PlayerWorkspace.LeftSidebar>
          )}

          <PlayerWorkspace.Main className="col-start-2">
            <RouteTransition />
          </PlayerWorkspace.Main>

          {isQueueVisible && (
            <PlayerWorkspace.RightSidebar
              width={rightSidebar.width}
              isCollapsed={isQueueCollapsed}
              onWidthChange={setRightSidebarWidth}
              onToggle={
                isFullscreen ? toggleFullscreenQueue : toggleRightSidebar
              }
              headerActions={<QueueHeaderActions />}
              peekDelayMs={SIDEBAR_PEEK_DELAY_MS}
            >
              {({ isCompact }) => (
                <ConnectedQueuePanel isCollapsed={isCompact} />
              )}
            </PlayerWorkspace.RightSidebar>
          )}
        </PlayerWorkspace>
      </SoundProvider>

      {!isNowPlaying && <ConnectedPlayerBar />}
      <Toaster />
      <ConnectedSettingsModal />
    </PlayerShell>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
});
