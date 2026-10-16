import { invoke } from '@tauri-apps/api/core';

import { AudioSource } from '@nuclearplayer/hifi';

export class AudioSourceFactory {
  private cachedStreamServerPort: number | null = null;

  async fromLocalFile(path: string): Promise<AudioSource> {
    const port = await this.streamServerPort();
    return {
      url: `http://127.0.0.1:${port}/file/${this.base64Url(path)}`,
      protocol: 'http',
    };
  }

  private async streamServerPort(): Promise<number> {
    if (this.cachedStreamServerPort === null) {
      this.cachedStreamServerPort = await invoke<number>('stream_server_port');
    }
    return this.cachedStreamServerPort;
  }

  private base64Url(value: string): string {
    const bytes = new TextEncoder().encode(value);
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join(
      '',
    );
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
