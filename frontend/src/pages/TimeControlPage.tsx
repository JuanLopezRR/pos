import { useEffect, useState } from 'react'
import { Clock, Play, Square, Coffee, Plus, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { timeApi } from '../api/endpoints'
import type { TimeRecord, Absence } from '../types'
import { formatDateTime, statusLabel, statusColor } from '../utils/formatters'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'

export default function TimeControlPage() {
  const [records, setRecords] = useState<TimeRecord[]>([])
  const [absences, setAbsences] = useState<Absence[]>([])
  const [todayRecord, setTodayRecord] = useState<TimeRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [absenceForm, setAbsenceForm] = useState({ start_date: '', end_date: '', absence_type: 'vacation', reason: '' })

  const loadData = async () => {
    setLoading(true)
    try {
      const [recordsRes, absencesRes] = await Promise.all([
        timeApi.records({ start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0] }),
        timeApi.absences.list(),
      ])
      setRecords(recordsRes.data)
      setAbsences(absencesRes.data)

      const today = recordsRes.data.find((r) => r.record_date === new Date().toISOString().split('T')[0])
      setTodayRecord(today || null)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const clockIn = async () => {
    try {
      const { data } = await timeApi.clockIn()
      setTodayRecord(data)
      toast.success('Fichaje de entrada registrado')
    } catch {}
  }

  const clockOut = async () => {
    try {
      const { data } = await timeApi.clockOut()
      setTodayRecord(data)
      toast.success('Fichaje de salida registrado')
    } catch {}
  }

  const breakStart = async () => {
    try {
      const { data } = await timeApi.breakStart()
      setTodayRecord(data)
      toast.success('Inicio de pausa registrado')
    } catch {}
  }

  const breakEnd = async () => {
    try {
      const { data } = await timeApi.breakEnd()
      setTodayRecord(data)
      toast.success('Fin de pausa registrado')
    } catch {}
  }

  const createAbsence = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await timeApi.absences.create(absenceForm)
      toast.success('Ausencia registrada')
      setModalOpen(false)
      loadData()
    } catch {}
  }

  const approveAbsence = async (id: string) => {
    try {
      await timeApi.absences.approve(id)
      toast.success('Ausencia aprobada')
      loadData()
    } catch {}
  }

  const isClockedIn = todayRecord?.clock_in && !todayRecord?.clock_out
  const isOnBreak = todayRecord?.break_start && !todayRecord?.break_end
  const isFinished = todayRecord?.clock_in && todayRecord?.clock_out

  const absenceColumns = [
    { key: 'absence_type', header: 'Tipo', render: (a: Absence) => (
      <span className="capitalize">{a.absence_type === 'vacation' ? 'Vacaciones' : a.absence_type === 'sick' ? 'Enfermedad' : a.absence_type === 'personal' ? 'Personal' : a.absence_type}</span>
    )},
    { key: 'start_date', header: 'Inicio' },
    { key: 'end_date', header: 'Fin' },
    { key: 'reason', header: 'Motivo' },
    { key: 'status', header: 'Estado', render: (a: Absence) => (
      <span className={`px-2 py-1 rounded-full text-xs ${statusColor(a.status)}`}>{statusLabel(a.status)}</span>
    )},
    { key: 'actions', header: '', render: (a: Absence) => a.status === 'pending' && (
      <button onClick={() => approveAbsence(a.id)} className="text-green-600 hover:text-green-700">
        <Check className="w-4 h-4" />
      </button>
    )},
  ]

  return (
    <div>
      <h1 className="page-title mb-6">Control Horario</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card lg:col-span-1">
          <h2 className="font-semibold mb-4">Fichaje Hoy</h2>
          <div className="text-center mb-4">
            <Clock className="w-12 h-12 text-primary-600 mx-auto mb-2" />
            {todayRecord ? (
              <div className="space-y-1 text-sm">
                <p>Entrada: {todayRecord.clock_in ? formatDateTime(todayRecord.clock_in) : '-'}</p>
                <p>Salida: {todayRecord.clock_out ? formatDateTime(todayRecord.clock_out) : '-'}</p>
                {todayRecord.break_start && <p>Pausa: {formatDateTime(todayRecord.break_start)}</p>}
                {todayRecord.break_end && <p>Fin pausa: {formatDateTime(todayRecord.break_end)}</p>}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Sin fichaje hoy</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {!todayRecord?.clock_in && (
              <button onClick={clockIn} className="btn-primary flex items-center justify-center gap-2 col-span-2">
                <Play className="w-4 h-4" /> Fichar Entrada
              </button>
            )}
            {isClockedIn && !isOnBreak && (
              <>
                <button onClick={breakStart} className="btn-secondary flex items-center justify-center gap-2">
                  <Coffee className="w-4 h-4" /> Pausa
                </button>
                <button onClick={clockOut} className="btn-danger flex items-center justify-center gap-2">
                  <Square className="w-4 h-4" /> Salida
                </button>
              </>
            )}
            {isOnBreak && (
              <button onClick={breakEnd} className="btn-primary flex items-center justify-center gap-2 col-span-2">
                <Play className="w-4 h-4" /> Volver de Pausa
              </button>
            )}
            {isFinished && (
              <button onClick={clockIn} className="btn-primary flex items-center justify-center gap-2 col-span-2">
                <Play className="w-4 h-4" /> Fichar de Nuevo
              </button>
            )}
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h2 className="font-semibold mb-4">Registro del Mes</h2>
          {loading ? (
            <p className="text-gray-400 text-center py-4">Cargando...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Fecha</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Entrada</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Salida</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Pausa</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => {
                    const total = r.clock_in && r.clock_out
                      ? ((new Date(r.clock_out).getTime() - new Date(r.clock_in).getTime()) / 3600000).toFixed(2)
                      : '-'
                    return (
                      <tr key={r.id} className="border-b border-gray-100">
                        <td className="px-3 py-2">{r.record_date}</td>
                        <td className="px-3 py-2">{r.clock_in ? formatDateTime(r.clock_in) : '-'}</td>
                        <td className="px-3 py-2">{r.clock_out ? formatDateTime(r.clock_out) : '-'}</td>
                        <td className="px-3 py-2">
                          {r.break_start && r.break_end
                            ? `${((new Date(r.break_end).getTime() - new Date(r.break_start).getTime()) / 3600000).toFixed(2)}h`
                            : '-'}
                        </td>
                        <td className="px-3 py-2 font-medium">{total}h</td>
                      </tr>
                    )
                  })}
                  {records.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-4 text-gray-400">Sin registros este mes</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Vacaciones y Ausencias</h2>
          <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Solicitar Ausencia
          </button>
        </div>
        <DataTable columns={absenceColumns} data={absences} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Solicitar Ausencia">
        <form onSubmit={createAbsence} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select value={absenceForm.absence_type} onChange={(e) => setAbsenceForm({ ...absenceForm, absence_type: e.target.value })} className="input-field">
              <option value="vacation">Vacaciones</option>
              <option value="sick">Enfermedad</option>
              <option value="personal">Asuntos Personales</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha Inicio</label>
              <input type="date" value={absenceForm.start_date} onChange={(e) => setAbsenceForm({ ...absenceForm, start_date: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha Fin</label>
              <input type="date" value={absenceForm.end_date} onChange={(e) => setAbsenceForm({ ...absenceForm, end_date: e.target.value })} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Motivo</label>
            <textarea value={absenceForm.reason} onChange={(e) => setAbsenceForm({ ...absenceForm, reason: e.target.value })} className="input-field" rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Solicitar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
