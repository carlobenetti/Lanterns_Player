import { FC } from 'react';

import { useSetting, type SettingDefinition } from '@nuclearplayer/plugin-sdk';

import { coreSettingsHost } from '../../services/settingsHost';
import { SettingField } from './SettingField';

export const SettingFieldWithHost: FC<{ definition: SettingDefinition }> = ({
  definition,
}) => {
  const [value, setValue] = useSetting(coreSettingsHost, definition.id);
  return (
    <SettingField definition={definition} value={value} setValue={setValue} />
  );
};
