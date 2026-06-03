import { useEffect, useState } from 'react'
import { Package, Users, Euro, AlertTriangle, FileText, TrendingUp } from 'lucide-react'
import { dashboardApi } from '../api/endpoints'
import type { DashboardSummary } from '../types'
import { formatCurrency } from '../utils/formatters'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.summary()
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-12 text-gray-400">Cargando...</div>

  const cards = [
    { label: 'Artículos', value: data?.articles_count || 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Stock Bajo', value: data?.low_stock || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Clientes', value: data?.customers_count || 0, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Ventas Hoy', value: formatCurrency(data?.today_sales || 0), icon: Euro, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pendientes', value: data?.pending_documents || 0, icon: FileText, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Ventas Mes', value: formatCurrency(data?.monthly_sales || 0), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div>
      <h1 className="page-title mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="card flex items-center gap-4">
            <div className={`p-3 rounded-xl ${card.bg}`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-4">Acceso Rápido</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Nuevo Artículo', href: '/articles' },
              { label: 'Nuevo Cliente', href: '/customers' },
              { label: 'Nueva Factura', href: '/documents' },
              { label: 'Abrir TPV', href: '/tpv' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 text-center font-medium text-sm"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">Resumen</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Artículos activos</span>
              <span className="font-medium">{data?.articles_count || 0}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Clientes activos</span>
              <span className="font-medium">{data?.customers_count || 0}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Productos con stock bajo</span>
              <span className="font-medium text-red-600">{data?.low_stock || 0}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Documentos pendientes</span>
              <span className="font-medium text-yellow-600">{data?.pending_documents || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
