import React from 'react';

import App from './App';
import { initLogStream } from './hooks/useLogStream';
import { registerBuiltInCoreSettings } from './services/coreSettings';
import { initHistoryService } from './services/history';
import {
  applyLanguageFromSettings,
  initLanguageWatcher,
} from './services/languageService';
import { initPlaybackEventBridge } from './services/playbackEventBridge';
import { initializeFavoritesStore } from './stores/favoritesStore';
import { initializePlaylistStore } from './stores/playlistStore';
import { initializeQueueStore } from './stores/queueStore';
import { initializeSettingsStore } from './stores/settingsStore';
import { initializeShortcutsStore } from './stores/shortcutsStore';

const initializeStores = () =>
  initializeSettingsStore()
    .then(() => initializeShortcutsStore())
    .then(() => initializeQueueStore())
    .then(() => initializeFavoritesStore())
    .then(() => initializePlaylistStore());

const initLanguage = () =>
  applyLanguageFromSettings().then(() => initLanguageWatcher());

export const initPlayerApp = async (
  root: ReturnType<typeof import('react-dom/client').createRoot>,
) => {
  initLogStream();

  await initializeStores()
    .then(() => registerBuiltInCoreSettings())
    .then(() => initPlaybackEventBridge())
    .then(() => initHistoryService())
    .then(() => initLanguage());

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
};
