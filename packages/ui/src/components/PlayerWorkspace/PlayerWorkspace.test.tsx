import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PlayerWorkspace } from './PlayerWorkspace';

describe('PlayerWorkspace', () => {
  it('(Snapshot) both sidebars expanded', () => {
    const { asFragment } = render(
      <PlayerWorkspace>
        <PlayerWorkspace.LeftSidebar
          width={200}
          isCollapsed={false}
          onWidthChange={() => {}}
          onToggle={() => {}}
        />
        <PlayerWorkspace.Main />
        <PlayerWorkspace.RightSidebar
          width={200}
          isCollapsed={false}
          onWidthChange={() => {}}
          onToggle={() => {}}
        />
      </PlayerWorkspace>,
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('(Snapshot) both sidebars collapsed', () => {
    const { asFragment } = render(
      <PlayerWorkspace>
        <PlayerWorkspace.LeftSidebar
          width={200}
          isCollapsed={true}
          onWidthChange={() => {}}
          onToggle={() => {}}
        />
        <PlayerWorkspace.Main />
        <PlayerWorkspace.RightSidebar
          width={200}
          isCollapsed={true}
          onWidthChange={() => {}}
          onToggle={() => {}}
        />
      </PlayerWorkspace>,
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('shows persistent footer in both collapsed and expanded states', () => {
    const persistentFooter = (
      <span data-testid="persistent-footer">v1.0.0</span>
    );
    const sidebarProps = {
      width: 200,
      onWidthChange: () => {},
      onToggle: () => {},
      persistentFooter,
    };

    const { rerender } = render(
      <PlayerWorkspace>
        <PlayerWorkspace.LeftSidebar {...sidebarProps} isCollapsed={true} />
        <PlayerWorkspace.Main />
      </PlayerWorkspace>,
    );

    expect(screen.getByTestId('persistent-footer')).toBeInTheDocument();

    rerender(
      <PlayerWorkspace>
        <PlayerWorkspace.LeftSidebar {...sidebarProps} isCollapsed={false} />
        <PlayerWorkspace.Main />
      </PlayerWorkspace>,
    );

    expect(screen.getByTestId('persistent-footer')).toBeInTheDocument();
  });

  describe('peek on hover', () => {
    const PEEK_DELAY_MS = 50;

    const renderCollapsedSidebar = () =>
      render(
        <PlayerWorkspace>
          <PlayerWorkspace.LeftSidebar
            width={200}
            isCollapsed={true}
            peekDelayMs={PEEK_DELAY_MS}
            onWidthChange={() => {}}
            onToggle={() => {}}
          >
            {({ isCompact }) => (
              <span data-testid="sidebar-content">
                {isCompact ? 'compact' : 'expanded'}
              </span>
            )}
          </PlayerWorkspace.LeftSidebar>
          <PlayerWorkspace.Main />
        </PlayerWorkspace>,
      );

    it('stays compact right after the mouse arrives', async () => {
      renderCollapsedSidebar();

      await userEvent.hover(screen.getByTestId('sidebar-left'));

      expect(screen.getByTestId('sidebar-content')).toHaveTextContent(
        'compact',
      );
    });

    it('expands after the mouse rests on it for the delay', async () => {
      renderCollapsedSidebar();

      await userEvent.hover(screen.getByTestId('sidebar-left'));

      expect(await screen.findByText('expanded')).toBeInTheDocument();
    });

    it('collapses again when the mouse leaves', async () => {
      renderCollapsedSidebar();

      await userEvent.hover(screen.getByTestId('sidebar-left'));
      await screen.findByText('expanded');
      await userEvent.unhover(screen.getByTestId('sidebar-left'));

      expect(screen.getByTestId('sidebar-content')).toHaveTextContent(
        'compact',
      );
    });
  });
});
