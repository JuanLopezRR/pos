export interface User {
  id: string
  company_id: string
  email: string
  username: string
  full_name: string
  role: string
  phone: string | null
  active: boolean
  created_at: string
}

export interface Company {
  id: string
  name: string
  nif: string | null
  address: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  phone: string | null
  email: string | null
  active: boolean
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
  company: Company
}

export interface ArticleFamily {
  id: string
  company_id: string
  name: string
  description: string | null
  parent_id: string | null
  active: boolean
  created_at: string
  children: ArticleFamily[]
}

export interface ArticleAttribute {
  id: string
  article_id: string
  attr_type: string
  value: string
  additional_price: number
  stock: number
  created_at: string
}

export interface Article {
  id: string
  company_id: string
  code: string
  barcode: string | null
  name: string
  description: string | null
  family_id: string | null
  tax_id: string | null
  cost_price: number
  sale_price: number
  stock: number
  min_stock: number
  max_stock: number
  stock_type: string
  image_url: string | null
  has_sizes: boolean
  has_colors: boolean
  active: boolean
  created_at: string
  updated_at: string
  family: ArticleFamily | null
  attributes: ArticleAttribute[]
}

export interface Customer {
  id: string
  company_id: string
  code: string | null
  name: string
  nif: string | null
  address: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  country: string
  phone: string | null
  email: string | null
  web: string | null
  notes: string | null
  credit_limit: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  company_id: string
  code: string | null
  name: string
  nif: string | null
  address: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  country: string
  phone: string | null
  email: string | null
  web: string | null
  contact_person: string | null
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Tax {
  id: string
  company_id: string
  name: string
  percentage: number
  active: boolean
  created_at: string
}

export interface DocumentLine {
  id?: string
  document_id?: string
  article_id?: string | null
  line_order?: number
  description: string
  quantity: number
  unit_price: number
  discount: number
  tax_percentage: number
  subtotal: number
}

export interface Document {
  id: string
  company_id: string
  doc_type: string
  number: string
  series: string | null
  issue_date: string
  due_date: string | null
  customer_id: string | null
  supplier_id: string | null
  subtotal: number
  discount: number
  tax_amount: number
  total: number
  status: string
  notes: string | null
  payment_method: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  lines: DocumentLine[]
}

export interface TpvSession {
  id: string
  company_id: string
  user_id: string
  opened_at: string
  closed_at: string | null
  opening_amount: number
  closing_amount: number | null
  cash_sales: number
  card_sales: number
  transfer_sales: number
  total_sales: number
  notes: string | null
  status: string
  created_at: string
}

export interface TimeRecord {
  id: string
  company_id: string
  user_id: string
  record_date: string
  clock_in: string | null
  clock_out: string | null
  break_start: string | null
  break_end: string | null
  notes: string | null
  created_at: string
}

export interface Absence {
  id: string
  company_id: string
  user_id: string
  start_date: string
  end_date: string
  absence_type: string
  reason: string | null
  status: string
  approved_by: string | null
  created_at: string
}

export interface DashboardSummary {
  articles_count: number
  low_stock: number
  customers_count: number
  today_sales: number
  pending_documents: number
  monthly_sales: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}
