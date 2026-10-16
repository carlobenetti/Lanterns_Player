import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type FC,
  type PropsWithChildren,
} from 'react';

import { usePlaylistStore } from '../../stores/playlistStore';

type CreatePlaylistContextValue = {
  isCreateDialogOpen: boolean;
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
  createPlaylist: (name: string) => Promise<void>;
};

const CreatePlaylistContext = createContext<CreatePlaylistContextValue | null>(
  null,
);

export const useCreatePlaylistContext = () => {
  const ctx = useContext(CreatePlaylistContext);
  if (!ctx) {
    throw new Error(
      'useCreatePlaylistContext must be used within <PlaylistsProvider>',
    );
  }
  return ctx;
};

const CreatePlaylistProvider: FC<PropsWithChildren> = ({ children }) => {
  const storeCreatePlaylist = usePlaylistStore((state) => state.createPlaylist);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const openCreateDialog = useCallback(() => setIsCreateDialogOpen(true), []);
  const closeCreateDialog = useCallback(() => setIsCreateDialogOpen(false), []);

  const createPlaylist = useCallback(
    async (name: string) => {
      await storeCreatePlaylist(name);
      setIsCreateDialogOpen(false);
    },
    [storeCreatePlaylist],
  );

  const value = useMemo(
    () => ({
      isCreateDialogOpen,
      openCreateDialog,
      closeCreateDialog,
      createPlaylist,
    }),
    [isCreateDialogOpen, openCreateDialog, closeCreateDialog, createPlaylist],
  );

  return (
    <CreatePlaylistContext.Provider value={value}>
      {children}
    </CreatePlaylistContext.Provider>
  );
};

export const PlaylistsProvider: FC<PropsWithChildren> = ({ children }) => (
  <CreatePlaylistProvider>{children}</CreatePlaylistProvider>
);
