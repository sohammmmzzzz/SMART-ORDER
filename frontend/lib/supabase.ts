import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Helper to subscribe to order changes
export function subscribeToOrders(callback: (payload: any) => void) {
  const channel = supabase
    .channel('orders-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
      },
      callback
    )
    .subscribe()

  return channel
}

// Helper to subscribe to pending orders
export function subscribeToPendingOrders(callback: (payload: any) => void) {
  const channel = supabase
    .channel('pending-orders-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: 'status=eq.pending',
      },
      callback
    )
    .subscribe()

  return channel
}
