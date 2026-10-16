import { invoke } from '@tauri-apps/api/core';

export const isFlatpak = async (): Promise<boolean> => {
  return invoke<boolean>('is_flatpak');
};
