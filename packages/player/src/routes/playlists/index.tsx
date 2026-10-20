import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/playlists/')({
  beforeLoad: () => {
    throw redirect({
      to: '/dashboard',
    });
  },
});
