import { beforeEach, describe, expect, it } from 'vitest';

import type { SettingDefinition } from '@nuclearplayer/plugin-sdk';

import { coreSettingsHost } from '../services/settingsHost';
import { resetInMemoryTauriStore } from '../test/utils/inMemoryTauriStore';
import {
  getSetting,
  initializeSettingsStore,
  registerCoreSettings,
  setSetting,
  useSettingsStore,
} from './settingsStore';

describe('useSettingsStore', () => {
  beforeEach(() => {
    resetInMemoryTauriStore();
    useSettingsStore.setState({ definitions: {}, values: {}, loaded: false });
  });

  describe('initial state', () => {
    it('starts with empty definitions and values, not loaded', async () => {
      const state = useSettingsStore.getState();
      expect(state.definitions).toEqual({});
      expect(state.values).toEqual({});
      expect(state.loaded).toBe(false);
    });
  });

  describe('core settings', () => {
    it('registerCoreSettings registers definitions and exposes defaults', async () => {
      const defs: SettingDefinition[] = [
        {
          id: 'general.language',
          title: 'Language',
          category: 'general',
          kind: 'string',
          default: 'en',
        },
      ];
      const registered = registerCoreSettings(defs);
      expect(registered).toContain('core.general.language');
      const value = useSettingsStore
        .getState()
        .getValue('core.general.language');
      expect(value).toBe('en');
    });

    it('coreSettingsHost get/set persists values via store', async () => {
      const host = coreSettingsHost;
      await host.set('general.language', 'fr');
      const stored = getSetting('core.general.language');
      expect(stored).toBe('fr');
      const readBack = await host.get<string>('general.language');
      expect(readBack).toBe('fr');
    });

    it('subscribe notifies listeners on value changes', async () => {
      const host = coreSettingsHost;
      const seen: Array<string | undefined> = [];
      const unsubscribe = host.subscribe<string>(
        'general.language',
        (value) => {
          seen.push(value);
        },
      );
      await host.set('general.language', 'fr');
      unsubscribe();
      expect(seen[0]).toBe('fr');
    });
  });

  describe('persistence', () => {
    it('initializeSettingsStore loads values from disk using Tauri store', async () => {
      await setSetting('core.general.language', 'fr');
      useSettingsStore.setState({ definitions: {}, values: {}, loaded: false });
      await initializeSettingsStore();
      const loaded = getSetting('core.general.language');
      expect(loaded).toBe('fr');
    });
  });
});
