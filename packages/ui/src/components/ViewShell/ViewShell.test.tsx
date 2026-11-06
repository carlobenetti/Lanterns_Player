import { render, screen } from '@testing-library/react';

import { ViewShell } from './ViewShell';

describe('ViewShell', () => {
  it('(Snapshot) renders a title with actions next to it', () => {
    const { asFragment } = render(
      <ViewShell
        title="All music"
        titleActions={<button data-testid="title-action">Open</button>}
      >
        <span>content</span>
      </ViewShell>,
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('shows the actions beside the title', () => {
    render(
      <ViewShell
        title="All music"
        titleActions={<button data-testid="title-action">Open</button>}
      >
        <span>content</span>
      </ViewShell>,
    );

    expect(screen.getByTestId('title')).toHaveTextContent('All music');
    expect(screen.getByTestId('title-action')).toBeInTheDocument();
  });
});
