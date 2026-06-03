import { useEffect, useState } from 'react'
import { Plus, FileText, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { documentsApi, articlesApi, customersApi } from '../api/endpoints'
import type { Document, Article, Customer, DocumentLine } from '../types'
import { formatCurrency, formatDate, docTypeLabel, statusLabel, statusColor } from '../utils/formatters'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterType, setFilterType] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [articles, setArticles] = useState<Article[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [form, setForm] = useState({ doc_type: 'invoice', customer_id: '', notes: '', payment_method: 'cash' })
  const [lines, setLines] = useState<DocumentLine[]>([{ article_id: '', description: '', quantity: 1, unit_price: 0, discount: 0, tax_percentage: 21, subtotal: 0 }])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await documentsApi.list({ doc_type: filterType, search, page, page_size: 50 })
      setDocuments(data.items)
      setTotal(data.total)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [search, page, filterType])

  const openCreate = async () => {
    try {
      const [articlesRes, customersRes] = await Promise.all([
        articlesApi.list({ page_size: 200 }),
        customersApi.list({ page_size: 200 }),
      ])
      setArticles(articlesRes.data.items)
      setCustomers(customersRes.data.items)
    } catch {}
    setForm({ doc_type: 'invoice', customer_id: '', notes: '', payment_method: 'cash' })
    setLines([{ article_id: '', description: '', quantity: 1, unit_price: 0, discount: 0, tax_percentage: 21, subtotal: 0 }])
    setModalOpen(true)
  }

  const addLine = () => setLines([...lines, { article_id: '', description: '', quantity: 1, unit_price: 0, discount: 0, tax_percentage: 21, subtotal: 0 } as DocumentLine])

  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx))

  const updateLine = (idx: number, field: string, value: string | number) => {
    const newLines = [...lines]
    newLines[idx] = { ...newLines[idx], [field]: value } as DocumentLine
    if (field === 'article_id') {
      const article = articles.find((a) => a.id === value)
      if (article) {
        newLines[idx].description = article.name
        newLines[idx].unit_price = article.sale_price
      }
    }
    setLines(newLines)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await documentsApi.create({ ...form, lines: lines.filter((l) => l.description) })
      toast.success('Documento creado')
      setModalOpen(false)
      load()
    } catch {}
  }

  const getTotal = () => lines.reduce((sum, l) => sum + (l.quantity * l.unit_price * (1 - l.discount / 100)), 0)

  const columns = [
    { key: 'number', header: 'Número' },
    { key: 'doc_type', header: 'Tipo', render: (d: Document) => (
      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">{docTypeLabel(d.doc_type)}</span>
    )},
    { key: 'issue_date', header: 'Fecha', render: (d: Document) => formatDate(d.issue_date) },
    { key: 'customer_name', header: 'Cliente' },
    { key: 'total', header: 'Total', render: (d: Document) => formatCurrency(d.total) },
    { key: 'status', header: 'Estado', render: (d: Document) => (
      <span className={`px-2 py-1 rounded-full text-xs ${statusColor(d.status)}`}>{statusLabel(d.status)}</span>
    )},
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Documentos</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Documento
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {['', 'invoice', 'quote', 'order', 'ticket'].map((t) => (
          <button key={t} onClick={() => { setFilterType(t); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t ? docTypeLabel(t) : 'Todos'}
          </button>
        ))}
      </div>

      <div className="card">
        <DataTable columns={columns} data={documents}
          searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1) }}
          searchPlaceholder="Buscar documento..."
          page={page} total={total} pageSize={50} onPageChange={setPage} loading={loading}
        />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo Documento" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select value={form.doc_type} onChange={(e) => setForm({ ...form, doc_type: e.target.value })} className="input-field">
                <option value="invoice">Factura</option>
                <option value="quote">Presupuesto</option>
                <option value="order">Pedido</option>
                <option value="ticket">Ticket</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cliente</label>
              <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} className="input-field">
                <option value="">Sin cliente</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Método Pago</label>
              <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="input-field">
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
              </select>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Artículo</th>
                  <th className="px-3 py-2 text-left">Descripción</th>
                  <th className="px-3 py-2 text-right">Cant</th>
                  <th className="px-3 py-2 text-right">Precio</th>
                  <th className="px-3 py-2 text-right">Dto %</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx} className="border-t border-gray-100">
                    <td className="px-3 py-2">
                      <select value={line.article_id ?? ''} onChange={(e) => updateLine(idx, 'article_id', e.target.value)} className="input-field text-sm">
                        <option value="">Seleccionar</option>
                        {articles.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input value={line.description} onChange={(e) => updateLine(idx, 'description', e.target.value)} className="input-field text-sm" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min={0} step="1" value={line.quantity} onChange={(e) => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)} className="input-field text-sm w-20 text-right" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min={0} step="0.01" value={line.unit_price} onChange={(e) => updateLine(idx, 'unit_price', parseFloat(e.target.value) || 0)} className="input-field text-sm w-24 text-right" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min={0} max={100} value={line.discount} onChange={(e) => updateLine(idx, 'discount', parseFloat(e.target.value) || 0)} className="input-field text-sm w-16 text-right" />
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatCurrency(line.quantity * line.unit_price * (1 - line.discount / 100))}
                    </td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => removeLine(idx)} className="text-red-500 text-xs">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={addLine} className="text-sm text-primary-600 hover:text-primary-700">
            + Añadir línea
          </button>

          <div className="text-right text-lg font-bold">
            Total: {formatCurrency(getTotal())}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notas</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Crear Documento</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
