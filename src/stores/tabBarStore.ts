import { create } from 'zustand';

export interface TabBarState {
  isTabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
}

export const useTabBarStore = create<TabBarState>((set) => ({
  isTabBarVisible: true,
  setTabBarVisible: (visible: boolean) => {
    set((state) => (state.isTabBarVisible === visible ? state : { isTabBarVisible: visible }));
  },
}));
