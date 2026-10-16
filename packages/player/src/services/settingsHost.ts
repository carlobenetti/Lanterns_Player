import type { SettingsHost, SettingValue } from '@nuclearplayer/plugin-sdk';

import { toCoreSettingId, useSettingsStore } from '../stores/settingsStore';

export const coreSettingsHost: SettingsHost = {
  get: async <T extends SettingValue = SettingValue>(id: string) =>
    useSettingsStore.getState().getValue(toCoreSettingId(id)) as T | undefined,
  set: async (id: string, value: SettingValue) => {
    await useSettingsStore.getState().setValue(toCoreSettingId(id), value);
  },
  subscribe: <T extends SettingValue = SettingValue>(
    id: string,
    listener: (value: T | undefined) => void,
  ) => {
    const fullyQualifiedId = toCoreSettingId(id);
    let previousValue = useSettingsStore
      .getState()
      .getValue(fullyQualifiedId) as T | undefined;
    return useSettingsStore.subscribe((state) => {
      const nextValue = state.getValue(fullyQualifiedId) as T | undefined;
      if (nextValue !== previousValue) {
        previousValue = nextValue;
        listener(nextValue);
      }
    });
  },
};
