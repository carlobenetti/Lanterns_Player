import type { ProviderRef, Track } from '@nuclearplayer/model';

export const createTrack = (provider: string, id: string): Track => ({
  title: `Track ${id}`,
  artists: [
    {
      name: 'Test Artist',
      roles: [],
      source: { provider: 'test', id: 'artist-1' },
    },
  ],
  source: { provider, id },
});

export const createProviderRef = (
  provider: string,
  id: string,
): ProviderRef => ({
  provider,
  id,
});
