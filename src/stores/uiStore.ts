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

  // Modals
  showCharacterModal: boolean;
  characterModalCallback: ((characterId: string) => void) | null;
  openCharacterModal: (callback?: (characterId: string) => void) => void;
  closeCharacterModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'adventure',
  isSidebarOpen: false,
  theme: 'green',
  showCharacterModal: false,
  characterModalCallback: null,

  setActiveTab: (activeTab) => set({ activeTab }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setTheme: (theme) => set({ theme }),

  // Modal Actions
  openCharacterModal: (callback) => set({ 
    showCharacterModal: true, 
    characterModalCallback: callback || null 
  }),
  closeCharacterModal: () => set({ 
    showCharacterModal: false, 
    characterModalCallback: null 
  }),
}));