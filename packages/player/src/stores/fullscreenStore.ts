import { getCurrentWindow } from '@tauri-apps/api/window';
import { create } from 'zustand';

import { Logger } from '../services/logger';

type FullscreenState = {
  isFullscreen: boolean;
  enter: () => void;
  exit: () => void;
};

const setWindowFullscreen = (isFullscreen: boolean) => {
  getCurrentWindow()
    .setFullscreen(isFullscreen)
    .catch((error) =>
      Logger.app.warn(`Could not change fullscreen mode: ${String(error)}`),
    );
};

export const useFullscreenStore = create<FullscreenState>((set, get) => ({
  isFullscreen: false,
  enter: () => {
    if (get().isFullscreen) {
      return;
    }
    set({ isFullscreen: true });
    setWindowFullscreen(true);
  },
  exit: () => {
    if (!get().isFullscreen) {
      return;
    }
    set({ isFullscreen: false });
    setWindowFullscreen(false);
  },
}));
