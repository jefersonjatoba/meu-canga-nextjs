import { SessionUser } from '@/types'
import { create } from 'zustand'

interface UserStore {
  user: SessionUser | null
  isAuthenticated: boolean
  setUser: (user: SessionUser | null) => void
  clearUser: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
}))
