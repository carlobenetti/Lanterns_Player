import { createRootRoute } from '@tanstack/react-router';
import { getCurrentWindow } from '@tauri-apps/api/window';
import {
  AudioLinesIcon,
  GaugeIcon,
  HistoryIcon,
  ListMusicIcon,
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

import { ConnectedPlayerBar } from '../components/ConnectedPlayerBar';
import {
  ConnectedQueuePanel,
  QueueHeaderActions,
} from '../components/ConnectedQueuePanel';
import { ConnectedSettingsModal } from '../components/ConnectedSettingsModal';
import { ConnectedTitleBar } from '../components/ConnectedTitleBar';
import { ConnectedTopBar } from '../components/ConnectedTopBar';
import { FlatpakWarningBanner } from '../components/FlatpakWarningBanner';
import { SoundProvider } from '../components/SoundProvider';
import { StreamResolver } from '../components/StreamResolver';
import { GlobalShortcuts } from '../shortcuts';
import { useLayoutStore } from '../stores/layoutStore';
import { useSettingsModalStore } from '../stores/settingsModalStore';

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
  useEffect(() => {
    const window = getCurrentWindow();
    window.show().then(() => window.setFocus());
  }, []);
  return (
    <PlayerShell onContextMenu={(e) => e.preventDefault()}>
      <GlobalShortcuts />
      <div>
        <ConnectedTitleBar />
        <FlatpakWarningBanner />
        <ConnectedTopBar />
      </div>
      <StreamResolver />
      <SoundProvider>
        <PlayerWorkspace>
          <PlayerWorkspace.LeftSidebar
            width={leftSidebar.width}
            isCollapsed={leftSidebar.isCollapsed}
            onWidthChange={setLeftSidebarWidth}
            onToggle={toggleLeftSidebar}
          >
            <SidebarNavigation isCompact={leftSidebar.isCollapsed}>
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
                <SidebarNavigationItem
                  to="/now-playing"
                  icon={<AudioLinesIcon />}
                  label={t('nowPlaying')}
                />
                <SidebarNavigationItem
                  to="/dashboard"
                  icon={<GaugeIcon />}
                  label={t('dashboard')}
                />
                <SidebarNavigationItem
                  to="/favorites/tracks"
                  icon={<MusicIcon />}
                  label={t('favoriteTracks')}
                />
                <SidebarNavigationItem
                  to="/playlists"
                  icon={<ListMusicIcon />}
                  label={t('playlists')}
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

          <PlayerWorkspace.Main>
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

      <ConnectedPlayerBar />
      <Toaster />
      <ConnectedSettingsModal />
    </PlayerShell>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
});
