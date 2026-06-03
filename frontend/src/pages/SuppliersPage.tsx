import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { suppliersApi } from '../api/endpoints'
import type { Supplier } from '../types'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState({ name: '', nif: '', address: '', city: '', phone: '', email: '', contact_person: '', notes: '' })

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await suppliersApi.list({ search, page, page_size: 50 })
      setSuppliers(data.items)
      setTotal(data.total)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [search, page])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', nif: '', address: '', city: '', phone: '', email: '', contact_person: '', notes: '' })
    setModalOpen(true)
  }

  const openEdit = (s: Supplier) => {
    setEditing(s)
    setForm({ name: s.name, nif: s.nif || '', address: s.address || '', city: s.city || '', phone: s.phone || '', email: s.email || '', contact_person: s.contact_person || '', notes: s.notes || '' })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await suppliersApi.update(editing.id, form)
        toast.success('Proveedor actualizado')
      } else {
        await suppliersApi.create(form)
        toast.success('Proveedor creado')
      }
      setModalOpen(false)
      load()
    } catch {}
  }

  const columns = [
    { key: 'name', header: 'Nombre' },
    { key: 'nif', header: 'NIF' },
    { key: 'contact_person', header: 'Contacto' },
    { key: 'phone', header: 'Teléfono' },
    { key: 'email', header: 'Email' },
    { key: 'city', header: 'Ciudad' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Proveedores</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Proveedor
        </button>
      </div>
      <div className="card">
        <DataTable columns={columns} data={suppliers}
          searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1) }}
          searchPlaceholder="Buscar proveedor..."
          page={page} total={total} pageSize={50} onPageChange={setPage}
          loading={loading} onRowClick={openEdit}
        />
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Proveedor' : 'Nuevo Proveedor'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">NIF</label>
              <input value={form.nif} onChange={(e) => setForm({ ...form, nif: e.target.value })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dirección</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ciudad</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Persona Contacto</label>
              <input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notas</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">{editing ? 'Guardar Cambios' : 'Crear Proveedor'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
