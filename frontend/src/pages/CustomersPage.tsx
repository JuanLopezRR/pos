import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { customersApi } from '../api/endpoints'
import type { Customer } from '../types'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState({ name: '', nif: '', address: '', city: '', province: '', phone: '', email: '', notes: '' })

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await customersApi.list({ search, page, page_size: 50 })
      setCustomers(data.items)
      setTotal(data.total)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [search, page])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', nif: '', address: '', city: '', province: '', phone: '', email: '', notes: '' })
    setModalOpen(true)
  }

  const openEdit = (c: Customer) => {
    setEditing(c)
    setForm({ name: c.name, nif: c.nif || '', address: c.address || '', city: c.city || '', province: c.province || '', phone: c.phone || '', email: c.email || '', notes: c.notes || '' })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await customersApi.update(editing.id, form)
        toast.success('Cliente actualizado')
      } else {
        await customersApi.create(form)
        toast.success('Cliente creado')
      }
      setModalOpen(false)
      load()
    } catch {}
  }

  const columns = [
    { key: 'name', header: 'Nombre' },
    { key: 'nif', header: 'NIF/DNI' },
    { key: 'phone', header: 'Teléfono' },
    { key: 'email', header: 'Email' },
    { key: 'city', header: 'Ciudad' },
    { key: 'active', header: 'Estado', render: (c: Customer) => (
      <span className={`px-2 py-1 rounded-full text-xs ${c.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {c.active ? 'Activo' : 'Inactivo'}
      </span>
    )},
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Clientes</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Cliente
        </button>
      </div>
      <div className="card">
        <DataTable
          columns={columns} data={customers}
          searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1) }}
          searchPlaceholder="Buscar por nombre, NIF, email..."
          page={page} total={total} pageSize={50} onPageChange={setPage}
          loading={loading} onRowClick={openEdit}
        />
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Cliente' : 'Nuevo Cliente'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">NIF/DNI</label>
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
              <label className="block text-sm font-medium mb-1">Provincia</label>
              <input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
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
            <button type="submit" className="btn-primary">{editing ? 'Guardar Cambios' : 'Crear Cliente'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
