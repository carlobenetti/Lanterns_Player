import { act } from '@testing-library/react';

import type {
  AndroidMediaAction,
  AndroidMediaState,
} from '../../services/androidMediaControls';

export class AndroidMediaBridgeMock {
  readonly updates: AndroidMediaState[] = [];

  install() {
    window.LanternsMedia = {
      update: (stateJson: string) => {
        this.updates.push(JSON.parse(stateJson));
      },
    };
  }

  uninstall() {
    delete window.LanternsMedia;
    delete window.__lanternsMediaAction;
  }

  get lastState(): AndroidMediaState | undefined {
    return this.updates.at(-1);
  }

  press(action: AndroidMediaAction, value?: number) {
    act(() => window.__lanternsMediaAction?.(action, value));
  }
}
