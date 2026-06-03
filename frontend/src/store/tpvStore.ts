import { create } from 'zustand'

interface CartItem {
  article_id: string
  code: string
  name: string
  quantity: number
  unit_price: number
  discount: number
  tax_percentage: number
  subtotal: number
}

interface TpvState {
  cart: CartItem[]
  activeSessionId: string | null
  addToCart: (item: Omit<CartItem, 'subtotal'>) => void
  removeFromCart: (article_id: string) => void
  updateQuantity: (article_id: string, quantity: number) => void
  updateDiscount: (article_id: string, discount: number) => void
  clearCart: () => void
  setActiveSession: (id: string | null) => void
  getCartTotal: () => number
}

export const useTpvStore = create<TpvState>((set, get) => ({
  cart: [],
  activeSessionId: null,

  addToCart: (item) => {
    const existing = get().cart.find((i) => i.article_id === item.article_id)
    if (existing) {
      set({
        cart: get().cart.map((i) =>
          i.article_id === item.article_id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unit_price }
            : i
        ),
      })
    } else {
      set({
        cart: [
          ...get().cart,
          { ...item, subtotal: item.quantity * item.unit_price * (1 - item.discount / 100) },
        ],
      })
    }
  },

  removeFromCart: (article_id) =>
    set({ cart: get().cart.filter((i) => i.article_id !== article_id) }),

  updateQuantity: (article_id, quantity) =>
    set({
      cart: get().cart.map((i) =>
        i.article_id === article_id
          ? { ...i, quantity, subtotal: quantity * i.unit_price * (1 - i.discount / 100) }
          : i
      ),
    }),

  updateDiscount: (article_id, discount) =>
    set({
      cart: get().cart.map((i) =>
        i.article_id === article_id
          ? { ...i, discount, subtotal: i.quantity * i.unit_price * (1 - discount / 100) }
          : i
      ),
    }),

  clearCart: () => set({ cart: [] }),

  setActiveSession: (id) => set({ activeSessionId: id }),

  getCartTotal: () => get().cart.reduce((sum, i) => sum + i.subtotal, 0),
}))
