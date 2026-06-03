import api from './client'
import type { AuthResponse } from '../types'

export const authApi = {
  login: (username: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { username, password }),

  register: (data: { email: string; username: string; password: string; full_name: string }) =>
    api.post<AuthResponse>('/auth/register', data),

  me: () => api.get<AuthResponse>('/auth/me'),
}
