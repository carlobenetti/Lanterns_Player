import { invoke } from '@tauri-apps/api/core';

import { AudioSource } from '@nuclearplayer/hifi';
import type { StreamCandidate } from '@nuclearplayer/model';

type ResolvedStream = NonNullable<StreamCandidate['stream']>;

export class AudioSourceFactory {
  private cachedStreamServerPort: number | null = null;

  async fromCandidate(candidate: StreamCandidate): Promise<AudioSource> {
    const { stream } = candidate;
    if (!stream) {
      return { url: candidate.id, protocol: 'http' };
    }

    if (stream.protocol === 'hls') {
      return { url: stream.url, protocol: 'hls' };
    }

    if (stream.protocol === 'file') {
      return {
        url: this.localFileUrl(stream.url, await this.streamServerPort()),
        protocol: 'http',
      };
    }

    const proxyUrl = this.proxiedUrl(stream.url, await this.streamServerPort());

    const durationMs = stream.durationMs ?? candidate.durationMs;
    if (this.isFmp4(stream) && durationMs) {
      return {
        url: proxyUrl,
        protocol: 'mse',
        durationSeconds: durationMs / 1000,
        codec: stream.codec,
      };
    }

    return { url: proxyUrl, protocol: stream.protocol };
  }

  private async streamServerPort(): Promise<number> {
    if (this.cachedStreamServerPort === null) {
      this.cachedStreamServerPort = await invoke<number>('stream_server_port');
    }
    return this.cachedStreamServerPort;
  }

  // Encode the URL in base64 and proxy through the local streaming server to bypass CORS
  // Check packages/player/src-tauri/src/stream_server.rs to see how this works
  private proxiedUrl(url: string, port: number): string {
    const encoded = btoa(url)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return `http://127.0.0.1:${port}/stream/${encoded}`;
  }

  private localFileUrl(path: string, port: number): string {
    return `http://127.0.0.1:${port}/file/${this.base64Url(path)}`;
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

  private isFmp4(stream: ResolvedStream): boolean {
    return (
      stream.container === 'm4a' ||
      stream.mimeType?.includes('audio/mp4') === true
    );
  }
}
