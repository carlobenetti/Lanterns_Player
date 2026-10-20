import { createFileRoute } from '@tanstack/react-router';

import { AllMusic } from '../views/AllMusic';

export const Route = createFileRoute('/library')({
  component: AllMusic,
});
