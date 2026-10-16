import { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { PlayerBar } from '@nuclearplayer/ui';

import { usePlaybackControls } from '../../hooks/usePlaybackControls';

export const ConnectedControls: FC = () => {
  const { t } = useTranslation('playerBar');
  const controls = usePlaybackControls();

  return (
    <PlayerBar.Controls
      isPlaying={controls.isPlaying}
      isShuffleActive={controls.isShuffleActive}
      repeatMode={controls.repeatMode}
      onPlayPause={controls.togglePlay}
      onNext={controls.goToNext}
      onPrevious={controls.goToPrevious}
      onShuffleToggle={controls.toggleShuffle}
      onRepeatToggle={controls.cycleRepeat}
      labels={{
        shuffleOn: t('shuffleOn'),
        shuffleOff: t('shuffleOff'),
        repeatOff: t('repeatOff'),
        repeatAll: t('repeatAll'),
        repeatOne: t('repeatOne'),
      }}
    />
  );
};
