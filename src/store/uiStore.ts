import { create } from 'zustand'

interface UIStore {
  darkMode: boolean
  sidebarOpen: boolean
  toggleDarkMode: () => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  darkMode: false,
  sidebarOpen: true,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
