import { createFileRoute } from '@tanstack/react-router';

import { NowPlaying } from '../views/NowPlaying';

export const Route = createFileRoute('/now-playing')({
  component: NowPlaying,
});
