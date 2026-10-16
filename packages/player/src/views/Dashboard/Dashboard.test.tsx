import { DashboardWrapper } from './Dashboard.test-wrapper';

describe('Dashboard view', () => {
  beforeEach(() => {
    DashboardWrapper.reset();
    DashboardWrapper.seedPlaylists();
  });

  it('shows the empty state when there are no music folders', async () => {
    await DashboardWrapper.mount();

    expect(DashboardWrapper.emptyState).toBeInTheDocument();
  });
});
