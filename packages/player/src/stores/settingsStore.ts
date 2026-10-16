import { LazyStore } from '@tauri-apps/plugin-store';
import { create } from 'zustand';

import type {
  SettingDefinition,
  SettingValue,
} from '@nuclearplayer/plugin-sdk';

const SETTINGS_FILE = 'settings.json';
const store = new LazyStore(SETTINGS_FILE);

type Registry = Record<string, SettingDefinition>;
type Values = Record<string, SettingValue>;

type State = {
  definitions: Registry;
  values: Values;
  loaded: boolean;
  loadFromDisk: () => Promise<void>;
  register: (definitions: SettingDefinition[]) => string[];
  getValue: (fullyQualifiedId: string) => SettingValue;
  setValue: (fullyQualifiedId: string, value: SettingValue) => Promise<void>;
};

export const toCoreSettingId = (id: string): string => `core.${id}`;

export const useSettingsStore = create<State>((set, get) => ({
  definitions: {},
  values: {},
  loaded: false,
  loadFromDisk: async () => {
    const storeEntries = await store.entries();
    const loadedValues: Values = {};
    for (const [key, entryValue] of storeEntries) {
      loadedValues[String(key)] = entryValue as SettingValue;
    }
    set({ values: loadedValues, loaded: true });
  },
  register: (definitions) => {
    const fullyQualifiedIds: string[] = [];
    const definitionsMap: Registry = { ...get().definitions };
    for (const definition of definitions) {
      const fullyQualifiedId = toCoreSettingId(definition.id);
      definitionsMap[fullyQualifiedId] = definition;
      fullyQualifiedIds.push(fullyQualifiedId);
    }
    set({ definitions: definitionsMap });
    return fullyQualifiedIds;
  },
  getValue: (fullyQualifiedId) => {
    const { values, definitions } = get();
    const currentValue = values[fullyQualifiedId];
    if (currentValue !== undefined) {
      return currentValue;
    }
    return definitions[fullyQualifiedId]?.default;
  },
  setValue: async (fullyQualifiedId, value) => {
    const nextValues = { ...get().values, [fullyQualifiedId]: value };
    set({ values: nextValues });
    await store.set(fullyQualifiedId, value as unknown);
    await store.save();
  },
}));

export const initializeSettingsStore = async (): Promise<void> => {
  await useSettingsStore.getState().loadFromDisk();
};

export const registerCoreSettings = (
  definitions: SettingDefinition[],
): string[] => useSettingsStore.getState().register(definitions);

export const getSetting = (fullyQualifiedId: string): SettingValue =>
  useSettingsStore.getState().getValue(fullyQualifiedId);

export const setSetting = async (
  fullyQualifiedId: string,
  value: SettingValue,
): Promise<void> =>
  useSettingsStore.getState().setValue(fullyQualifiedId, value);
