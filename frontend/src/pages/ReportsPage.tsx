import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { reportsApi } from '../api/endpoints'
import { formatCurrency } from '../utils/formatters'

export default function ReportsPage() {
  const [salesData, setSalesData] = useState<any[]>([])
  const [topArticles, setTopArticles] = useState<any[]>([])
  const [topCustomers, setTopCustomers] = useState<any[]>([])
  const [lowStock, setLowStock] = useState<any[]>([])
  const [period, setPeriod] = useState('day')

  useEffect(() => {
    reportsApi.sales({ group_by: period }).then(({ data }) => setSalesData(data)).catch(() => {})
    reportsApi.topArticles(10).then(({ data }) => setTopArticles(data)).catch(() => {})
    reportsApi.customers().then(({ data }) => setTopCustomers(data)).catch(() => {})
    reportsApi.stock().then(({ data }) => setLowStock(data)).catch(() => {})
  }, [period])

  return (
    <div>
      <h1 className="page-title mb-6">Informes</h1>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Ventas</h2>
          <div className="flex gap-2">
            {['day', 'month'].map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-sm ${period === p ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {p === 'day' ? 'Por Día' : 'Por Mes'}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-4">Top Artículos Vendidos</h2>
          <div className="space-y-3">
            {topArticles.map((a, i) => (
              <div key={a.article_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <span className="text-sm">{a.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{a.quantity} uds</p>
                  <p className="text-xs text-gray-400">{formatCurrency(a.amount)}</p>
                </div>
              </div>
            ))}
            {topArticles.length === 0 && <p className="text-gray-400 text-sm">Sin datos</p>}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">Top Clientes</h2>
          <div className="space-y-3">
            {topCustomers.map((c, i) => (
              <div key={c.customer_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <span className="text-sm">{c.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{c.documents} docs</p>
                  <p className="text-xs text-gray-400">{formatCurrency(c.total)}</p>
                </div>
              </div>
            ))}
            {topCustomers.length === 0 && <p className="text-gray-400 text-sm">Sin datos</p>}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">Stock Bajo</h2>
          <div className="space-y-3">
            {lowStock.map((a) => (
              <div key={a.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-gray-400">{a.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600">{a.stock}</p>
                  <p className="text-xs text-gray-400">Mín: {a.min_stock}</p>
                </div>
              </div>
            ))}
            {lowStock.length === 0 && <p className="text-gray-400 text-sm">Sin productos con stock bajo</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
