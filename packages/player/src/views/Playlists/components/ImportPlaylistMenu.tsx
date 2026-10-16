import { Import } from 'lucide-react';
import { type FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { Button, Popover } from '@nuclearplayer/ui';

import { usePlaylistImport } from '../../../hooks/usePlaylistImport';

export const ImportPlaylistMenu: FC = () => {
  const { t } = useTranslation('playlists');
  const { importFromJson } = usePlaylistImport();

  return (
    <>
      <Popover
        className="relative"
        panelClassName="surface-background px-0 py-0"
        trigger={
          <Button size="icon" data-testid="import-playlist-button">
            <Import size={16} />
          </Button>
        }
        anchor="bottom start"
      >
        <Popover.Menu>
          <Popover.Item
            icon={<Import size={16} />}
            onClick={importFromJson}
            data-testid="import-json-option"
          >
            {t('importJson')}
          </Popover.Item>
        </Popover.Menu>
      </Popover>
    </>
  );
};
