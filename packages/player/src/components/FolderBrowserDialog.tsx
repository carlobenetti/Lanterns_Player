import { useQuery } from '@tanstack/react-query';
import { ArrowUp, Folder, HardDrive } from 'lucide-react';
import { FC, useState } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { Button, Dialog, Loader } from '@nuclearplayer/ui';

import { commands, type FolderEntry } from '../services/tauri/bindings';
import { unwrapResult } from '../services/tauri/results';

const INTERNAL_STORAGE_PATH = '/storage/emulated/0';
const ICON_SIZE = 20;

type FolderBrowserDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (folderPath: string) => void;
};

const useStorageRootLabel = () => {
  const { t } = useTranslation('dashboard');
  return (root: FolderEntry) =>
    root.path === INTERNAL_STORAGE_PATH
      ? t('folder-browser-internal-storage')
      : root.name;
};

const FolderRow: FC<{
  icon: typeof Folder;
  label: string;
  onClick: () => void;
}> = ({ icon: Icon, label, onClick }) => (
  <li>
    <button
      type="button"
      onClick={onClick}
      className="hover:bg-muted flex w-full items-center gap-3 rounded-md px-3 py-3 text-left active:scale-[0.99]"
    >
      <Icon size={ICON_SIZE} className="text-accent-green shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  </li>
);

const FolderBrowser: FC<Omit<FolderBrowserDialogProps, 'isOpen'>> = ({
  onClose,
  onSelect,
}) => {
  const { t } = useTranslation('dashboard');
  const rootLabel = useStorageRootLabel();
  const [browsedPath, setBrowsedPath] = useState<string | null>();

  const rootsQuery = useQuery({
    queryKey: ['storage-roots'],
    queryFn: () => commands.storageRoots(),
  });
  const roots = rootsQuery.data ?? [];
  const startPath = roots.length === 1 ? roots[0].path : null;
  const currentPath = browsedPath === undefined ? startPath : browsedPath;

  const listingQuery = useQuery({
    queryKey: ['folder-listing', currentPath],
    queryFn: async () => unwrapResult(await commands.listFolder(currentPath!)),
    enabled: currentPath !== null,
  });
  const listing = listingQuery.data;

  const currentRoot = roots.find((root) => root.path === currentPath);
  const currentLabel =
    currentPath === null
      ? t('folder-browser-storage')
      : currentRoot
        ? rootLabel(currentRoot)
        : (listing?.name ?? '');
  const parentPath = listing?.parent ?? null;
  const canGoUp =
    currentPath !== null && (parentPath !== null || roots.length > 1);
  const isLoading =
    rootsQuery.isPending || (currentPath !== null && listingQuery.isPending);

  return (
    <div data-testid="folder-browser" className="flex min-h-0 flex-col gap-3">
      <Dialog.Title>{t('folder-browser-title')}</Dialog.Title>
      <p className="text-sm opacity-70">{t('folder-browser-hint')}</p>

      <div className="border-border flex items-center gap-2 border-b-(length:--border-width) pb-2">
        <Button
          size="icon-sm"
          variant="text"
          data-testid="folder-browser-up"
          aria-label={t('folder-browser-up')}
          disabled={!canGoUp}
          onClick={() => setBrowsedPath(parentPath)}
        >
          <ArrowUp size={ICON_SIZE} />
        </Button>
        <span
          data-testid="folder-browser-current"
          className="truncate font-bold"
        >
          {currentLabel}
        </span>
      </div>

      <div className="min-h-40 overflow-y-auto">
        {isLoading && <Loader />}
        {listingQuery.isError && (
          <p className="text-sm opacity-70">{t('folder-browser-error')}</p>
        )}
        {!isLoading && currentPath === null && (
          <ul data-testid="folder-browser-list" className="flex flex-col">
            {roots.map((root) => (
              <FolderRow
                key={root.path}
                icon={HardDrive}
                label={rootLabel(root)}
                onClick={() => setBrowsedPath(root.path)}
              />
            ))}
          </ul>
        )}
        {listing && currentPath !== null && (
          <ul data-testid="folder-browser-list" className="flex flex-col">
            {listing.folders.map((folder) => (
              <FolderRow
                key={folder.path}
                icon={Folder}
                label={folder.name}
                onClick={() => setBrowsedPath(folder.path)}
              />
            ))}
          </ul>
        )}
        {listing?.folders.length === 0 && (
          <p className="px-3 py-2 text-sm opacity-70">
            {t('folder-browser-empty')}
          </p>
        )}
      </div>

      {listing && listing.audioFileCount > 0 && (
        <p
          data-testid="folder-browser-audio-count"
          className="text-sm font-bold"
        >
          {t('folder-browser-audio-count', { count: listing.audioFileCount })}
        </p>
      )}

      <Dialog.Actions>
        <Button variant="text" onClick={onClose}>
          {t('common:actions.cancel')}
        </Button>
        <Button
          data-testid="folder-browser-confirm"
          disabled={currentPath === null}
          onClick={() => currentPath && onSelect(currentPath)}
        >
          {t('folder-browser-confirm')}
        </Button>
      </Dialog.Actions>
    </div>
  );
};

export const FolderBrowserDialog: FC<FolderBrowserDialogProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => (
  <Dialog.Root
    isOpen={isOpen}
    onClose={onClose}
    className="flex max-h-[85dvh] flex-col"
  >
    <FolderBrowser onClose={onClose} onSelect={onSelect} />
  </Dialog.Root>
);
