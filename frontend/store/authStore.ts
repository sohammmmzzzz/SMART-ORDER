import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  username: string
  role: 'user' | 'pantry' | 'admin'
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        localStorage.setItem('auth_token', token)
        localStorage.setItem('user_data', JSON.stringify(user))
        set({ user, token, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
        set({ user: null, token: null, isAuthenticated: false })
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
