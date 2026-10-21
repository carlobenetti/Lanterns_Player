import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FC } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import App from '../App';
import { useCoreSetting } from '../hooks/useCoreSetting';
import { registerBuiltInCoreSettings } from '../services/coreSettings';
import { coreSettingsHost } from '../services/settingsHost';
import {
  initializeSettingsStore,
  useSettingsStore,
} from '../stores/settingsStore';
import { resetInMemoryTauriStore } from '../test/utils/inMemoryTauriStore';

const TestCoreSettingText: FC<{ id: string; testId: string }> = ({
  id,
  testId,
}) => {
  const [value] = useCoreSetting(id);
  return <div data-testid={testId}>{String(value)}</div>;
};

describe('Settings integration', () => {
  beforeEach(() => {
    resetInMemoryTauriStore();
    useSettingsStore.setState({ definitions: {}, values: {}, loaded: false });
    document.documentElement.removeAttribute('data-theme');
  });

  it('core sees updated values via core host and hook', async () => {
    await initializeSettingsStore();
    registerBuiltInCoreSettings();

    render(<TestCoreSettingText id={'general.language'} testId="lang" />);

    await coreSettingsHost.set('general.language', 'fr');

    await waitFor(async () => {
      const node = await screen.findByTestId('lang');
      expect(node).toHaveTextContent('fr');
    });
  });

  it('values persist across reload via Tauri store mock', async () => {
    await initializeSettingsStore();
    registerBuiltInCoreSettings();

    await coreSettingsHost.set('general.language', 'fr');

    useSettingsStore.setState({ definitions: {}, values: {}, loaded: false });
    await initializeSettingsStore();
    registerBuiltInCoreSettings();

    const persisted = await coreSettingsHost.get<string>('general.language');
    expect(persisted).toBe('fr');
  });

  it('dark mode toggle persists across restarts', async () => {
    await initializeSettingsStore();
    registerBuiltInCoreSettings();

    render(<App />);

    const toggle = await screen.findByRole('button', { name: 'Light mode' });
    await userEvent.click(toggle);

    expect(document.documentElement.getAttribute('data-theme')).toBeNull();

    // Simulate player restart
    cleanup();
    useSettingsStore.setState({ definitions: {}, values: {}, loaded: false });
    await initializeSettingsStore();
    registerBuiltInCoreSettings();

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Dark mode' }),
      ).toBeInTheDocument();
      expect(document.documentElement.getAttribute('data-theme')).toBeNull();
    });
  });
});
