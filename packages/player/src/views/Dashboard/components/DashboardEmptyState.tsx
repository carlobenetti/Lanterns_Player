import { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { EmptyState, TopBarLogo } from '@nuclearplayer/ui';

import { isMobilePlatform } from '../../../services/platform';

export const DashboardEmptyState: FC = () => {
  const { t } = useTranslation('dashboard');

  return (
    <EmptyState
      data-testid="dashboard-empty-state"
      icon={<TopBarLogo className="h-16 w-16" />}
      title={t('empty-state')}
      description={t(
        isMobilePlatform()
          ? 'empty-state-description-mobile'
          : 'empty-state-description',
      )}
      className="flex-1"
    />
  );
};
