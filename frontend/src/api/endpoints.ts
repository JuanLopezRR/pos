import api from './client'
import type { Article, ArticleFamily, Customer, Supplier, Document, Tax, TpvSession, TimeRecord, Absence, DashboardSummary, PaginatedResponse } from '../types'

export const articlesApi = {
  list: (params?: { search?: string; family_id?: string; page?: number; page_size?: number }) =>
    api.get<PaginatedResponse<Article>>('/articles', { params }),
  get: (id: string) => api.get<Article>(`/articles/${id}`),
  create: (data: Partial<Article>) => api.post<Article>('/articles', data),
  update: (id: string, data: Partial<Article>) => api.put<Article>(`/articles/${id}`, data),
  delete: (id: string) => api.delete(`/articles/${id}`),
  families: {
    list: () => api.get<ArticleFamily[]>('/articles/families'),
    create: (data: { name: string; description?: string; parent_id?: string }) =>
      api.post<ArticleFamily>('/articles/families', data),
  },
}

export const customersApi = {
  list: (params?: { search?: string; page?: number; page_size?: number }) =>
    api.get<PaginatedResponse<Customer>>('/customers', { params }),
  get: (id: string) => api.get<Customer>(`/customers/${id}`),
  create: (data: Partial<Customer>) => api.post<Customer>('/customers', data),
  update: (id: string, data: Partial<Customer>) => api.put<Customer>(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
}

export const suppliersApi = {
  list: (params?: { search?: string; page?: number; page_size?: number }) =>
    api.get<PaginatedResponse<Supplier>>('/suppliers', { params }),
  get: (id: string) => api.get<Supplier>(`/suppliers/${id}`),
  create: (data: Partial<Supplier>) => api.post<Supplier>('/suppliers', data),
  update: (id: string, data: Partial<Supplier>) => api.put<Supplier>(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
}

export const documentsApi = {
  list: (params?: { doc_type?: string; search?: string; page?: number; page_size?: number }) =>
    api.get<PaginatedResponse<Document>>('/documents', { params }),
  get: (id: string) => api.get<Document>(`/documents/${id}`),
  create: (data: Partial<Document>) => api.post<Document>('/documents', data),
  delete: (id: string) => api.delete(`/documents/${id}`),
  updateStatus: (id: string, status: string) => api.post(`/documents/${id}/status?status=${status}`),
  taxes: {
    list: () => api.get<Tax[]>('/documents/taxes'),
    create: (data: { name: string; percentage: number }) => api.post<Tax>('/documents/taxes', data),
  },
}

export const tpvApi = {
  getActiveSession: () => api.get<TpvSession | null>('/tpv/sessions/active'),
  openSession: (data: { opening_amount: number }) => api.post<TpvSession>('/tpv/sessions/open', data),
  closeSession: (id: string, data: { closing_amount: number; notes?: string }) =>
    api.post<TpvSession>(`/tpv/sessions/${id}/close`, data),
  listSessions: () => api.get<TpvSession[]>('/tpv/sessions'),
  getSession: (id: string) => api.get<TpvSession>(`/tpv/sessions/${id}`),
}

export const timeApi = {
  clockIn: () => api.post<TimeRecord>('/time/clock-in'),
  clockOut: () => api.post<TimeRecord>('/time/clock-out'),
  breakStart: () => api.post<TimeRecord>('/time/break-start'),
  breakEnd: () => api.post<TimeRecord>('/time/break-end'),
  records: (params?: { user_id?: string; start_date?: string; end_date?: string }) =>
    api.get<TimeRecord[]>('/time/records', { params }),
  absences: {
    list: () => api.get<Absence[]>('/time/absences'),
    create: (data: Partial<Absence>) => api.post<Absence>('/time/absences', data),
    approve: (id: string) => api.put<Absence>(`/time/absences/${id}/approve`),
  },
}

export const dashboardApi = {
  summary: () => api.get<DashboardSummary>('/dashboard/summary'),
}

export const reportsApi = {
  sales: (params?: { start_date?: string; end_date?: string; group_by?: string }) =>
    api.get('/reports/sales', { params }),
  topArticles: (limit?: number) => api.get('/reports/top-articles', { params: { limit } }),
  customers: () => api.get('/reports/customers'),
  stock: () => api.get('/reports/stock'),
}
