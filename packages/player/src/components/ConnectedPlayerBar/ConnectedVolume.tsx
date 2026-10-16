import { FC } from 'react';

import { PlayerBar } from '@nuclearplayer/ui';

import { useCoreSetting } from '../../hooks/useCoreSetting';

type ConnectedVolumeProps = {
  className?: string;
};

export const ConnectedVolume: FC<ConnectedVolumeProps> = ({ className }) => {
  const [volume, setVolume] = useCoreSetting<number>('playback.volume');

  const handleVolumeChange = (value: number) => {
    setVolume(value / 100);
  };

  return (
    <PlayerBar.Volume
      value={Math.round((volume ?? 1) * 100)}
      onValueChange={handleVolumeChange}
      className={className}
    />
  );
};
