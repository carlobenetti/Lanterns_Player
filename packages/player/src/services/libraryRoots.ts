import { LazyStore } from '@tauri-apps/plugin-store';

const ROOTS_KEY = 'roots';

export const DEFAULT_LIBRARY_ROOTS = ['G:\\Meu Drive\\Music'];

const store = new LazyStore('library.json');

export const libraryRoots = {
  async list(): Promise<string[]> {
    return (await store.get<string[]>(ROOTS_KEY)) ?? DEFAULT_LIBRARY_ROOTS;
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
