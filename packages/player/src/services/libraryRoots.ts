import { LazyStore } from '@tauri-apps/plugin-store';

import { isMobilePlatform } from './platform';

const ROOTS_KEY = 'roots';

const DESKTOP_LIBRARY_ROOTS = ['G:\\Meu Drive\\Music'];

const MOBILE_LIBRARY_ROOTS = ['/storage/emulated/0/Music'];

const defaultLibraryRoots = () =>
  isMobilePlatform() ? MOBILE_LIBRARY_ROOTS : DESKTOP_LIBRARY_ROOTS;

const store = new LazyStore('library.json');

export const libraryRoots = {
  async list(): Promise<string[]> {
    return (await store.get<string[]>(ROOTS_KEY)) ?? defaultLibraryRoots();
  },

  async add(folderPath: string): Promise<void> {
    const roots = await this.list();
    if (roots.includes(folderPath)) {
      return;
    }
    await store.set(ROOTS_KEY, [...roots, folderPath]);
    await store.save();
  },
};
