import { create } from "zustand"

interface UIState {
  sidebarCollapsed: boolean
  aiPanelOpen: boolean
  activeContextFilter: string | null
  toggleSidebar: () => void
  toggleAiPanel: () => void
  setContextFilter: (filter: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  aiPanelOpen: false,
  activeContextFilter: null,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleAiPanel: () => set((state) => ({ aiPanelOpen: !state.aiPanelOpen })),
  setContextFilter: (filter) => set({ activeContextFilter: filter }),
}))
