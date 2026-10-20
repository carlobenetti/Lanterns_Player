import { createRootRoute, useRouterState } from '@tanstack/react-router';
import { getCurrentWindow } from '@tauri-apps/api/window';
import {
  AudioLinesIcon,
  HistoryIcon,
  LibraryIcon,
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
import { SoundProvider } from '../components/SoundProvider';
import { StreamResolver } from '../components/StreamResolver';
import { useFramelessWindow } from '../hooks/useFramelessWindow';
import { GlobalShortcuts } from '../shortcuts';
import { useFullscreenStore } from '../stores/fullscreenStore';
import { useLayoutStore } from '../stores/layoutStore';
import { useSettingsModalStore } from '../stores/settingsModalStore';

const NOW_PLAYING_PATH = '/now-playing';

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
            >
              <SidebarNavigation isCompact={leftSidebar.isCollapsed}>
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
                  <AddFolderButton />
                  <ConnectedThemeController />
                  <div className="border-border my-1 border-t-(length:--border-width)" />
                  <SidebarNavigationItem
                    to="/now-playing"
                    icon={<AudioLinesIcon />}
                    label={t('nowPlaying')}
                  />
                  <SidebarNavigationItem
                    to="/dashboard"
                    icon={<LibraryIcon />}
                    label={t('dashboard')}
                  />
                  <SidebarNavigationItem
                    to="/favorites/tracks"
                    icon={<MusicIcon />}
                    label={t('favoriteTracks')}
                  />
                  <SidebarNavigationItem
                    to="/history"
                    icon={<HistoryIcon />}
                    label={t('history')}
                  />
                </div>
                <SidebarNavigationItem
                  icon={<SettingsIcon />}
                  label={tPrefs('title')}
                  onClick={() => openSettings()}
                />
              </SidebarNavigation>
            </PlayerWorkspace.LeftSidebar>
          )}

          <PlayerWorkspace.Main className="col-start-2">
            <RouteTransition />
          </PlayerWorkspace.Main>

          <PlayerWorkspace.RightSidebar
            width={rightSidebar.width}
            isCollapsed={rightSidebar.isCollapsed}
            onWidthChange={setRightSidebarWidth}
            onToggle={toggleRightSidebar}
            headerActions={<QueueHeaderActions />}
          >
            <ConnectedQueuePanel isCollapsed={rightSidebar.isCollapsed} />
          </PlayerWorkspace.RightSidebar>
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
