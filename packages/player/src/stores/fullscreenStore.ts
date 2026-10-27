import { getCurrentWindow } from '@tauri-apps/api/window';
import { create } from 'zustand';

import { Logger } from '../services/logger';

type FullscreenState = {
  isFullscreen: boolean;
  isQueueOpen: boolean;
  enter: () => void;
  exit: () => void;
  toggleQueue: () => void;
};

const logFailure = (error: unknown) =>
  Logger.app.warn(`Could not change fullscreen mode: ${String(error)}`);

export const useFullscreenStore = create<FullscreenState>((set, get) => {
  let wasMaximized = false;

  const enterWindowFullscreen = async () => {
    const window = getCurrentWindow();
    wasMaximized = await window.isMaximized();
    if (wasMaximized) {
      await window.unmaximize();
    }
    await window.setFullscreen(true);
  };

  const exitWindowFullscreen = async () => {
    const window = getCurrentWindow();
    await window.setFullscreen(false);
    if (wasMaximized) {
      await window.maximize();
    }
  };

  return {
    isFullscreen: false,
    isQueueOpen: false,
    enter: () => {
      if (get().isFullscreen) {
        return;
      }
      set({ isFullscreen: true, isQueueOpen: false });
      enterWindowFullscreen().catch(logFailure);
    },
    exit: () => {
      if (!get().isFullscreen) {
        return;
      }
      set({ isFullscreen: false, isQueueOpen: false });
      exitWindowFullscreen().catch(logFailure);
    },
    toggleQueue: () => set((state) => ({ isQueueOpen: !state.isQueueOpen })),
  };
});
