import { create } from 'zustand';

export type ActiveTab = 'adventure' | 'combat' | 'character' | 'map' | 'journal' | 'settings';
export type Theme = 'green' | 'amber';

interface UIState {
  activeTab: ActiveTab;
  isSidebarOpen: boolean;
  theme: Theme;
  setActiveTab: (tab: ActiveTab) => void;
  toggleSidebar: () => void;
  setTheme: (theme: Theme) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'adventure',
  isSidebarOpen: false,
  theme: 'green',
  setActiveTab: (activeTab) => set({ activeTab }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));