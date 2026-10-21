import { platform } from '@tauri-apps/plugin-os';

const MOBILE_PLATFORMS = ['android', 'ios'];

export const isMobilePlatform = (): boolean =>
  MOBILE_PLATFORMS.includes(platform());
