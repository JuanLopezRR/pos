import { useEffect, useState, useCallback } from 'react'
import { Search, X, Trash2, ShoppingCart, Printer, DollarSign, CreditCard, Smartphone } from 'lucide-react'
import toast from 'react-hot-toast'
import { articlesApi, documentsApi, tpvApi } from '../api/endpoints'
import { useTpvStore } from '../store/tpvStore'
import type { Article, ArticleFamily, TpvSession, DocumentLine } from '../types'
import { formatCurrency } from '../utils/formatters'

export default function TpvPage() {
  const { cart, activeSessionId, addToCart, removeFromCart, updateQuantity, clearCart, setActiveSession } = useTpvStore()
  const [articles, setArticles] = useState<Article[]>([])
  const [families, setFamilies] = useState<ArticleFamily[]>([])
  const [search, setSearch] = useState('')
  const [selectedFamily, setSelectedFamily] = useState('')
  const [session, setSession] = useState<TpvSession | null>(null)
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [openingAmount, setOpeningAmount] = useState(0)
  const [paymentModal, setPaymentModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState('cash')
  const [customerName, setCustomerName] = useState('')

  const loadArticles = useCallback(async () => {
    try {
      const { data } = await articlesApi.list({ search, family_id: selectedFamily || undefined, page_size: 100 })
      setArticles(data.items)
    } catch {}
  }, [search, selectedFamily])

  const checkSession = useCallback(async () => {
    try {
      const { data } = await tpvApi.getActiveSession()
      if (data) {
        setSession(data)
        setActiveSession(data.id)
      } else {
        setSession(null)
        setActiveSession(null)
        setShowOpenModal(true)
      }
    } catch { setShowOpenModal(true) }
  }, [])

  const loadFamilies = useCallback(async () => {
    try {
      const { data } = await articlesApi.families.list()
      setFamilies(data)
    } catch {}
  }, [])

  useEffect(() => { checkSession() }, [])
  useEffect(() => { loadArticles() }, [search, selectedFamily])
  useEffect(() => { loadFamilies() }, [])

  const openSession = async () => {
    try {
      const { data } = await tpvApi.openSession({ opening_amount: openingAmount })
      setSession(data)
      setActiveSession(data.id)
      setShowOpenModal(false)
      toast.success('Sesión abierta')
    } catch {}
  }

  const closeSession = async () => {
    if (!session) return
    const total = cart.reduce((s, i) => s + i.subtotal, 0)
    try {
      await tpvApi.closeSession(session.id, { closing_amount: total, notes: '' })
      setSession(null)
      setActiveSession(null)
      clearCart()
      toast.success('Sesión cerrada')
      checkSession()
    } catch {}
  }

  const processPayment = async () => {
    if (cart.length === 0) { toast.error('Carrito vacío'); return }
    if (!session) { toast.error('No hay sesión abierta'); return }

    try {
      const doc = await documentsApi.create({
        doc_type: 'ticket',
        customer_id: null,
        notes: customerName ? `Cliente: ${customerName}` : '',
        payment_method: selectedPayment,
        lines: cart.map((item) => ({
          article_id: item.article_id,
          description: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          tax_percentage: item.tax_percentage,
          subtotal: item.subtotal,
        } as DocumentLine)),
      })
      toast.success('Venta completada')
      clearCart()
      setCustomerName('')
      setPaymentModal(false)
    } catch {}
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.subtotal, 0)
  const cartTax = cart.reduce((sum, i) => sum + (i.subtotal * i.tax_percentage / (100 + i.tax_percentage)), 0)

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-6rem)]">
      <div className="flex-1 flex flex-col card overflow-hidden">
        <div className="mb-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar artículos..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10" autoFocus
          />
        </div>
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
          <button onClick={() => setSelectedFamily('')}
            className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedFamily === '' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}>
            Todas
          </button>
          {families.map((f) => (
            <button key={f.id} onClick={() => setSelectedFamily(f.id)}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedFamily === f.id ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}>
              {f.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
          {articles.filter((a) => a.active && a.stock > 0).map((article) => (
            <button key={article.id}
              onClick={() => addToCart({ article_id: article.id, code: article.code, name: article.name, quantity: 1, unit_price: article.sale_price, discount: 0, tax_percentage: 21 })}
              className="border border-gray-200 rounded-xl hover:border-primary-400 hover:shadow-sm transition-all bg-white"
            >
              <div className="h-24 bg-gray-50 flex items-center justify-center border-b border-gray-100">
                {article.image_url ? (
                  <img src={article.image_url} alt={article.name} className="max-h-full max-w-full object-contain" loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : null}
              </div>
              <div className="p-2 text-center">
                <p className="font-medium text-sm leading-tight">{article.name}</p>
                <p className="text-primary-600 font-bold text-sm mt-0.5">{formatCurrency(article.sale_price)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-96 flex flex-col card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Ticket</h2>
          {session && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              Sesión activa
            </span>
          )}
        </div>

        <div className="flex-1 overflow-auto space-y-2 mb-4">
          {cart.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Carrito vacío</p>
          ) : (
            cart.map((item) => (
              <div key={item.article_id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <input type="number" min={1} value={item.quantity}
                      onChange={(e) => updateQuantity(item.article_id, parseFloat(e.target.value) || 1)}
                      className="w-14 text-center border border-gray-200 rounded text-sm p-1"
                    />
                    <span>x {formatCurrency(item.unit_price)}</span>
                    <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.article_id)}
                  className="p-1 text-gray-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-200 pt-3 space-y-1 text-sm">
          <div className="flex justify-between"><span>Base:</span><span>{formatCurrency(cartTotal - cartTax)}</span></div>
          <div className="flex justify-between"><span>IVA:</span><span>{formatCurrency(cartTax)}</span></div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span><span>{formatCurrency(cartTotal)}</span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <button disabled={cart.length === 0 || !session}
            onClick={() => setPaymentModal(true)}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <DollarSign className="w-4 h-4" /> Cobrar ({formatCurrency(cartTotal)})
          </button>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setSelectedPayment('cash')}
              className={`flex items-center justify-center gap-1 p-2 rounded-lg text-sm border transition-colors ${selectedPayment === 'cash' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200'}`}>
              <DollarSign className="w-4 h-4" /> Efectivo
            </button>
            <button onClick={() => setSelectedPayment('card')}
              className={`flex items-center justify-center gap-1 p-2 rounded-lg text-sm border transition-colors ${selectedPayment === 'card' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200'}`}>
              <CreditCard className="w-4 h-4" /> Tarjeta
            </button>
            <button onClick={() => setSelectedPayment('transfer')}
              className={`flex items-center justify-center gap-1 p-2 rounded-lg text-sm border transition-colors ${selectedPayment === 'transfer' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200'}`}>
              <Smartphone className="w-4 h-4" /> Bizum
            </button>
          </div>
          <button onClick={clearCart} disabled={cart.length === 0}
            className="btn-secondary w-full">Limpiar Carrito</button>
          {session && (
            <button onClick={closeSession} className="btn-danger w-full">Cerrar Sesión TPV</button>
          )}
        </div>
      </div>

      {showOpenModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <ShoppingCart className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-center mb-2">Abrir Sesión TPV</h2>
            <p className="text-sm text-gray-500 text-center mb-4">Introduce el efectivo inicial en caja</p>
            <input type="number" step="0.01" value={openingAmount}
              onChange={(e) => setOpeningAmount(parseFloat(e.target.value) || 0)}
              className="input-field text-center text-lg mb-4" placeholder="$ 0"
            />
            <button onClick={openSession} className="btn-primary w-full">Abrir Sesión</button>
          </div>
        </div>
      )}

      {paymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-bold mb-4">Confirmar Pago</h2>
            <p className="text-3xl font-bold text-center mb-4">{formatCurrency(cartTotal)}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Cliente (opcional)</label>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                className="input-field" placeholder="Nombre del cliente"
              />
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Método: <span className="font-medium capitalize">{selectedPayment === 'cash' ? 'Efectivo' : selectedPayment === 'card' ? 'Tarjeta' : 'Bizum'}</span>
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPaymentModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={processPayment} className="btn-primary flex-1">Cobrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
