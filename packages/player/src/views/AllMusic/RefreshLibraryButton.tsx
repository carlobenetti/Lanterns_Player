import { RefreshCwIcon } from 'lucide-react';
import type { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { Button, cn, Tooltip } from '@nuclearplayer/ui';

import { useRefreshLibrary } from './useRefreshLibrary';

const ICON_SIZE = 16;

export const RefreshLibraryButton: FC = () => {
  const { t } = useTranslation('dashboard');
  const { refresh, isRefreshing } = useRefreshLibrary();

  return (
    <Tooltip content={t('refresh-library')} side="bottom">
      <Button
        variant="tertiary"
        size="icon"
        onClick={refresh}
        disabled={isRefreshing}
        aria-label={t('refresh-library')}
        data-testid="refresh-library-button"
      >
        <RefreshCwIcon
          size={ICON_SIZE}
          strokeWidth={3}
          className={cn(isRefreshing && 'animate-spin')}
        />
      </Button>
    </Tooltip>
  );
};
