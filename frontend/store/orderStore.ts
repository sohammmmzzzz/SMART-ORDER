import { create } from 'zustand'

interface OrderItem {
  item_id: string
  name: string
  category: string
  quantity: number
}

type OrderStatus = 'idle' | 'confirming' | 'preparing' | 'completed'

interface OrderState {
  selectedItems: OrderItem[]
  location: string | null
  // Timer states
  orderStatus: OrderStatus
  countdown: number
  preparationTime: number
  showOrderModal: boolean
  // Actions
  addItem: (item: OrderItem) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  setLocation: (location: string) => void
  clearOrder: () => void
  getTotalItems: () => number
  // Timer actions
  setOrderStatus: (status: OrderStatus) => void
  setCountdown: (countdown: number) => void
  setPreparationTime: (time: number) => void
  setShowOrderModal: (show: boolean) => void
  decrementCountdown: () => void
  decrementPreparationTime: () => void
  resetTimer: () => void
}

export const useOrderStore = create<OrderState>((set, get) => ({
  selectedItems: [],
  location: null,
  // Timer initial states
  orderStatus: 'idle',
  countdown: 5,
  preparationTime: 900,
  showOrderModal: false,

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

  clearOrder: () => set({ selectedItems: [] }),

  getTotalItems: () => {
    const state = get()
    return state.selectedItems.reduce((total, item) => total + item.quantity, 0)
  },

  // Timer actions
  setOrderStatus: (status) => set({ orderStatus: status }),

  setCountdown: (countdown) => set({ countdown }),

  setPreparationTime: (time) => set({ preparationTime: time }),

  setShowOrderModal: (show) => set({ showOrderModal: show }),

  decrementCountdown: () => set((state) => ({ countdown: Math.max(0, state.countdown - 1) })),

  decrementPreparationTime: () => set((state) => ({
    preparationTime: Math.max(0, state.preparationTime - 1)
  })),

  resetTimer: () => set({
    orderStatus: 'idle',
    countdown: 5,
    preparationTime: 900,
    showOrderModal: false
  }),
}))
