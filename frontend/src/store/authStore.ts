import { create } from 'zustand'
import type { User, Company } from '../types'

interface AuthState {
  token: string | null
  user: User | null
  company: Company | null
  isAuthenticated: boolean
  setAuth: (token: string, user: User, company: Company) => void
  logout: () => void
  loadFromStorage: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  company: null,
  isAuthenticated: false,

  setAuth: (token, user, company) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('company', JSON.stringify(company))
    set({ token, user, company, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('company')
    set({ token: null, user: null, company: null, isAuthenticated: false })
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    const companyStr = localStorage.getItem('company')
    if (token && userStr && companyStr) {
      try {
        const user = JSON.parse(userStr) as User
        const company = JSON.parse(companyStr) as Company
        set({ token, user, company, isAuthenticated: true })
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('company')
      }
    }
  },
}))
