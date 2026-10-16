import { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { EmptyState, TopBarLogo } from '@nuclearplayer/ui';

export const DashboardEmptyState: FC = () => {
  const { t } = useTranslation('dashboard');

  return (
    <EmptyState
      data-testid="dashboard-empty-state"
      icon={<TopBarLogo className="h-16 w-16" />}
      title={t('empty-state')}
      description={t('empty-state-description')}
      className="flex-1"
    />
  );
};
