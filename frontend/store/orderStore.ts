import { create } from 'zustand'

interface OrderItem {
  item_id: string
  name: string
  category: string
  quantity: number
}

interface OrderState {
  selectedItems: OrderItem[]
  location: string | null
  addItem: (item: OrderItem) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  setLocation: (location: string) => void
  clearOrder: () => void
  getTotalItems: () => number
}

export const useOrderStore = create<OrderState>((set, get) => ({
  selectedItems: [],
  location: null,

  addItem: (item) =>
    set((state) => {
      const existingItem = state.selectedItems.find((i) => i.item_id === item.item_id)
      if (existingItem) {
        return {
          selectedItems: state.selectedItems.map((i) =>
            i.item_id === item.item_id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        }
      }
      return { selectedItems: [...state.selectedItems, { ...item, quantity: 1 }] }
    }),

  removeItem: (itemId) =>
    set((state) => ({
      selectedItems: state.selectedItems.filter((i) => i.item_id !== itemId),
    })),

  updateQuantity: (itemId, quantity) =>
    set((state) => ({
      selectedItems: state.selectedItems.map((i) =>
        i.item_id === itemId ? { ...i, quantity } : i
      ),
    })),

  setLocation: (location) => set({ location }),

  clearOrder: () => set({ selectedItems: [], location: null }),

  getTotalItems: () => {
    const state = get()
    return state.selectedItems.reduce((total, item) => total + item.quantity, 0)
  },
}))
