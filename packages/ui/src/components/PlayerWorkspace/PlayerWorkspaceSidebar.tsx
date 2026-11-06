import { PanelLeft, PanelRight } from 'lucide-react';
import { motion } from 'motion/react';
import { FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { Button } from '../Button';
import { SIDEBAR_ANIMATIONS, SIDEBAR_CONFIG } from './constants';
import { useSidebarPeek, useSidebarResize } from './hooks';

export type SidebarRenderState = {
  isCompact: boolean;
};

export type PlayerWorkspaceSidebarPropsBase = {
  children?: ReactNode | ((state: SidebarRenderState) => ReactNode);
  headerActions?: ReactNode;
  footer?: ReactNode;
  persistentFooter?: ReactNode;
  isCollapsed: boolean;
  width: number;
  onWidthChange: (width: number) => void;
  onToggle: () => void;
  peekDelayMs?: number;
  className?: string;
};

type PlayerWorkspaceSidebarProps = PlayerWorkspaceSidebarPropsBase & {
  side: 'left' | 'right';
};

export const PlayerWorkspaceSidebar: FC<PlayerWorkspaceSidebarProps> = ({
  children,
  headerActions,
  footer,
  persistentFooter,
  isCollapsed,
  width,
  onWidthChange,
  onToggle,
  peekDelayMs,
  side,
  className = '',
}) => {
  const { isPeeking, startPeek, stopPeek } = useSidebarPeek(
    isCollapsed,
    peekDelayMs,
  );
  const isCompact = isCollapsed && !isPeeking;
  const { handleMouseDown, isResizingState } = useSidebarResize(
    width,
    onWidthChange,
    side,
    isCollapsed,
  );

  const reservedWidth = isCollapsed ? SIDEBAR_CONFIG.COLLAPSED_WIDTH : width;
  const panelWidth = isCompact ? SIDEBAR_CONFIG.COLLAPSED_WIDTH : width;
  const transition = isResizingState
    ? SIDEBAR_ANIMATIONS.width.instant
    : SIDEBAR_ANIMATIONS.width.spring;

  return (
    <div
      data-testid={`sidebar-${side}`}
      data-compact={isCompact}
      className="relative z-20"
      onMouseEnter={startPeek}
      onMouseLeave={stopPeek}
    >
      <motion.div
        className="h-full"
        animate={{ width: reservedWidth }}
        transition={transition}
      />
      <motion.div
        data-testid={`sidebar-panel-${side}`}
        className={cn(
          'border-border absolute inset-y-0 flex flex-col overflow-hidden',
          {
            'surface-sidebar-left left-0 border-r-(length:--border-width)':
              side === 'left',
            'surface-sidebar-right right-0 border-l-(length:--border-width)':
              side === 'right',
            'shadow-shadow': isPeeking,
          },
          className,
        )}
        animate={{ width: panelWidth }}
        transition={transition}
      >
        <span
          className={cn('mb-4 flex flex-row items-center', {
            'justify-end': side === 'left',
            'justify-start': side === 'right',
            'px-2 pt-2': !isCompact,
          })}
        >
          <Button
            data-testid={`sidebar-toggle-${side}`}
            className={cn('top-2 px-2', {
              'right-1': side === 'left',
              'left-1': side === 'right',
              'mx-1 mt-2': side === 'right' && isCompact,
            })}
            size="icon"
            onClick={() => {
              stopPeek();
              onToggle();
            }}
          >
            {side === 'left' ? <PanelLeft /> : <PanelRight />}
          </Button>
          {!isCompact && headerActions && (
            <span className="flex flex-1 items-center justify-end gap-1">
              {headerActions}
            </span>
          )}
        </span>
        <div
          className={cn('flex flex-1 flex-col overflow-hidden', {
            'px-2 pb-2': !isCompact,
          })}
        >
          {typeof children === 'function' ? children({ isCompact }) : children}
        </div>

        {!isCompact && footer}

        {persistentFooter && (
          <div className="mt-auto flex flex-col items-center gap-2 py-2">
            {persistentFooter}
          </div>
        )}

        {!isCollapsed && (
          <div
            className={cn(
              'absolute top-0 bottom-0 w-1 cursor-col-resize transition-colors',
              side === 'left' ? 'right-0' : 'left-0',
            )}
            onMouseDown={handleMouseDown}
          />
        )}
      </motion.div>
    </div>
  );
};
