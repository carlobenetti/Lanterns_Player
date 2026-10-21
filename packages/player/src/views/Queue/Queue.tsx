import { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';

import {
  ConnectedQueuePanel,
  QueueHeaderActions,
} from '../../components/ConnectedQueuePanel';

export const Queue: FC = () => {
  const { t } = useTranslation('queue');

  return (
    <div
      data-testid="queue-view"
      className="surface-background flex h-full min-h-0 flex-col"
    >
      <header className="flex shrink-0 items-center gap-2 px-4 pt-4 pb-2">
        <h1 className="flex-1 text-2xl font-bold">{t('title')}</h1>
        <QueueHeaderActions />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        <ConnectedQueuePanel />
      </div>
    </div>
  );
};
