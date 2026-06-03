import { useEffect, useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import { articlesApi } from '../api/endpoints'
import type { Article, ArticleFamily } from '../types'
import { formatCurrency } from '../utils/formatters'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [families, setFamilies] = useState<ArticleFamily[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [familyModalOpen, setFamilyModalOpen] = useState(false)
  const [newFamilyName, setNewFamilyName] = useState('')
  const [editing, setEditing] = useState<Article | null>(null)
  const [form, setForm] = useState({
    code: '', name: '', description: '', family_id: '', cost_price: 0, sale_price: 0,
    stock: 0, min_stock: 0, max_stock: 0, barcode: '', image_url: '',
  })

  const loadArticles = async () => {
    setLoading(true)
    try {
      const { data } = await articlesApi.list({ search, page, page_size: 50 })
      setArticles(data.items)
      setTotal(data.total)
    } catch {} finally { setLoading(false) }
  }

  const loadFamilies = async () => {
    try {
      const { data } = await articlesApi.families.list()
      setFamilies(data)
    } catch {}
  }

  const createFamily = async () => {
    if (!newFamilyName.trim()) { toast.error('Nombre requerido'); return }
    try {
      await articlesApi.families.create({ name: newFamilyName })
      toast.success('Familia creada')
      setNewFamilyName('')
      setFamilyModalOpen(false)
      loadFamilies()
    } catch {}
  }

  useEffect(() => { loadArticles() }, [search, page])
  useEffect(() => { loadFamilies() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ code: '', name: '', description: '', family_id: '', cost_price: 0, sale_price: 0, stock: 0, min_stock: 0, max_stock: 0, barcode: '', image_url: '' })
    setModalOpen(true)
  }

  const openEdit = (article: Article) => {
    setEditing(article)
    setForm({
      code: article.code, name: article.name, description: article.description || '',
      family_id: article.family_id || '', cost_price: article.cost_price,
      sale_price: article.sale_price, stock: article.stock, min_stock: article.min_stock,
      max_stock: article.max_stock, barcode: article.barcode || '', image_url: article.image_url || '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await articlesApi.update(editing.id, form)
        toast.success('Artículo actualizado')
      } else {
        await articlesApi.create(form)
        toast.success('Artículo creado')
      }
      setModalOpen(false)
      loadArticles()
    } catch {}
  }

  const handleDelete = async (article: Article) => {
    if (!confirm(`¿Desactivar artículo ${article.name}?`)) return
    try {
      await articlesApi.delete(article.id)
      toast.success('Artículo desactivado')
      loadArticles()
    } catch {}
  }

  const columns = [
    { key: 'code', header: 'Código' },
    { key: 'name', header: 'Nombre' },
    { key: 'family_name', header: 'Familia', render: (a: Article) => a.family?.name || '-' },
    { key: 'stock', header: 'Stock', render: (a: Article) => (
      <span className={a.stock <= a.min_stock ? 'text-red-600 font-medium' : ''}>
        {a.stock}
      </span>
    )},
    { key: 'sale_price', header: 'Precio', render: (a: Article) => formatCurrency(a.sale_price) },
    { key: 'active', header: 'Estado', render: (a: Article) => (
      <span className={`px-2 py-1 rounded-full text-xs ${a.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {a.active ? 'Activo' : 'Inactivo'}
      </span>
    )},
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Artículos</h1>
        <div className="flex gap-2">
          <button onClick={() => setFamilyModalOpen(true)} className="btn-secondary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Familia
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nuevo Artículo
          </button>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={articles}
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); setPage(1) }}
          searchPlaceholder="Buscar por código, nombre o barcode..."
          page={page}
          total={total}
          pageSize={50}
          onPageChange={setPage}
          loading={loading}
          onRowClick={openEdit}
        />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Artículo' : 'Nuevo Artículo'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código *</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Código Barras</label>
              <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Familia</label>
              <select value={form.family_id} onChange={(e) => setForm({ ...form, family_id: e.target.value })} className="input-field">
                <option value="">Sin familia</option>
                {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock</label>
              <input type="number" step="0.01" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseFloat(e.target.value) || 0 })} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Precio Coste</label>
              <input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: parseFloat(e.target.value) || 0 })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Precio Venta</label>
              <input type="number" step="0.01" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: parseFloat(e.target.value) || 0 })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock Mínimo</label>
              <input type="number" step="0.01" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: parseFloat(e.target.value) || 0 })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL de Imagen</label>
            <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="input-field" placeholder="https://..." />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">{editing ? 'Guardar Cambios' : 'Crear Artículo'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={familyModalOpen} onClose={() => setFamilyModalOpen(false)} title="Nueva Familia">
        <form onSubmit={(e) => { e.preventDefault(); createFamily() }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre de la familia</label>
            <input value={newFamilyName} onChange={(e) => setNewFamilyName(e.target.value)}
              className="input-field" placeholder="Ej: Ropa, Electrónica..." autoFocus
            />
          </div>
          {families.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Familias existentes:</p>
              <div className="flex flex-wrap gap-2">
                {families.map((f) => (
                  <span key={f.id} className="px-2 py-1 bg-gray-100 rounded-lg text-sm">{f.name}</span>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setFamilyModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Crear Familia</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
