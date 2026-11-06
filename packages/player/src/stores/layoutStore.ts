import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const LAYOUT_STORE_VERSION = 1;

export interface LayoutState {
  leftSidebar: {
    isCollapsed: boolean;
    width: number;
  };
  rightSidebar: {
    isCollapsed: boolean;
    width: number;
  };
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setLeftSidebarWidth: (width: number) => void;
  setRightSidebarWidth: (width: number) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      leftSidebar: {
        isCollapsed: true,
        width: 200,
      },
      rightSidebar: {
        isCollapsed: true,
        width: 200,
      },
      toggleLeftSidebar: () =>
        set((state) => ({
          leftSidebar: {
            ...state.leftSidebar,
            isCollapsed: !state.leftSidebar.isCollapsed,
          },
        })),
      toggleRightSidebar: () =>
        set((state) => ({
          rightSidebar: {
            ...state.rightSidebar,
            isCollapsed: !state.rightSidebar.isCollapsed,
          },
        })),
      setLeftSidebarWidth: (width: number) =>
        set((state) => ({
          leftSidebar: {
            ...state.leftSidebar,
            width,
          },
        })),
      setRightSidebarWidth: (width: number) =>
        set((state) => ({
          rightSidebar: {
            ...state.rightSidebar,
            width,
          },
        })),
    }),
    {
      name: 'nuclear-layout-store',
      version: LAYOUT_STORE_VERSION,
      migrate: (persistedState) => {
        const state = persistedState as LayoutState;
        return {
          ...state,
          leftSidebar: { ...state.leftSidebar, isCollapsed: true },
          rightSidebar: { ...state.rightSidebar, isCollapsed: true },
        };
      },
    },
  ),
);
