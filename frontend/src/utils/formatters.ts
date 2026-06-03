export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value)

export const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

export const formatDateTime = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export const docTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    invoice: 'Factura',
    quote: 'Presupuesto',
    order: 'Pedido',
    ticket: 'Ticket',
  }
  return labels[type] || type
}

export const statusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: 'Borrador',
    completed: 'Completado',
    cancelled: 'Anulado',
    pending: 'Pendiente',
    approved: 'Aprobado',
  }
  return labels[status] || status
}

export const statusColor = (status: string): string => {
  const colors: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    pending: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    open: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
