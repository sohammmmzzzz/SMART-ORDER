"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import anime from "animejs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuthStore } from "@/store/authStore"
import { api } from "@/lib/api"
import { subscribeToPendingOrders } from "@/lib/supabase"
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  MoreVertical,
  Clock,
  MapPin,
  User,
  Package,
} from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Order {
  id: string
  user_id: string
  username?: string
  items: any[]
  location: string
  status: string
  created_at: string
  completed_at?: string
  updated_at: string
}

export default function PantryDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMenu, setShowMenu] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [orderHistory, setOrderHistory] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated || (user?.role !== "pantry" && user?.role !== "admin")) {
      router.push("/login")
      return
    }

    fetchOrders()
    setupRealtimeSubscription()

    // Poll for updates every 5 seconds as backup
    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
  }, [isAuthenticated, user, router])

  const setupRealtimeSubscription = () => {
    const channel = subscribeToPendingOrders((payload) => {
      console.log("Realtime update:", payload)
      fetchOrders()
    })

    return () => {
      channel.unsubscribe()
    }
  }

  const fetchOrders = async () => {
    try {
      const data = await api.getPendingOrders()
      setOrders(data)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching orders:", error)
      setIsLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const data = await api.getOrderHistory(50, 0)
      setOrderHistory(data.filter((o: Order) => o.status !== "pending"))
    } catch (error) {
      console.error("Error fetching history:", error)
    }
  }

  const handleCompleteOrder = async () => {
    if (orders.length === 0) return

    const currentOrder = orders[currentIndex]

    try {
      await api.updateOrderStatus(currentOrder.id, "completed")

      // Animate out
      anime({
        targets: cardRef.current,
        opacity: [1, 0],
        translateX: [0, -100],
        duration: 300,
        easing: "easeInExpo",
        complete: () => {
          // Remove from list and reset animation
          setOrders((prev) => prev.filter((_, idx) => idx !== currentIndex))
          setCurrentIndex((prev) => Math.max(0, Math.min(prev, orders.length - 2)))

          // Animate in next order
          setTimeout(() => {
            if (cardRef.current) {
              anime({
                targets: cardRef.current,
                opacity: [0, 1],
                translateX: [100, 0],
                duration: 300,
                easing: "easeOutExpo",
              })
            }
          }, 50)
        },
      })
    } catch (error) {
      console.error("Error completing order:", error)
      alert("Failed to complete order")
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      animateCardTransition("right")
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < orders.length - 1) {
      animateCardTransition("left")
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const animateCardTransition = (direction: "left" | "right") => {
    if (!cardRef.current) return

    const translateValue = direction === "left" ? -100 : 100

    anime({
      targets: cardRef.current,
      opacity: [1, 0],
      translateX: [0, translateValue],
      duration: 200,
      easing: "easeInQuad",
      complete: () => {
        anime({
          targets: cardRef.current,
          opacity: [0, 1],
          translateX: [-translateValue, 0],
          duration: 200,
          easing: "easeOutQuad",
        })
      },
    })
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleShowHistory = async () => {
    await fetchHistory()
    setShowHistory(true)
  }

  const currentOrder = orders[currentIndex]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pantry Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.username}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowMenu(!showMenu)}
                title="Menu"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-4">
              <Package className="h-24 w-24 mx-auto text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No Pending Orders</h2>
            <p className="text-gray-600">
              All orders have been completed. Great job!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Order counter */}
            <div className="text-center">
              <p className="text-lg font-medium text-gray-700">
                Order {currentIndex + 1} of {orders.length}
              </p>
              {orders.length > 1 && (
                <p className="text-sm text-gray-500">
                  {orders.length - 1} more order(s) in queue
                </p>
              )}
            </div>

            {/* Order card */}
            <Card ref={cardRef} className="shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">Order #{currentOrder?.id.slice(0, 8)}</CardTitle>
                    <CardDescription>
                      Placed {currentOrder && formatDate(currentOrder.created_at)}
                    </CardDescription>
                  </div>
                  <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                    Pending
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Customer info */}
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="h-5 w-5" />
                  <span className="font-medium">{currentOrder?.username || "Unknown User"}</span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="h-5 w-5" />
                  <span>{currentOrder?.location}</span>
                </div>

                {/* Order time */}
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="h-5 w-5" />
                  <span>
                    {currentOrder &&
                      new Date(currentOrder.created_at).toLocaleTimeString()}
                  </span>
                </div>

                {/* Items */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 text-lg">Order Items:</h3>
                  <div className="space-y-2">
                    {currentOrder?.items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.category}</p>
                        </div>
                        <div className="text-lg font-semibold">x{item.quantity}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Complete button */}
                <Button
                  onClick={handleCompleteOrder}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  Mark as Complete
                </Button>
              </CardContent>
            </Card>

            {/* Navigation */}
            {orders.length > 1 && (
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNext}
                  disabled={currentIndex === orders.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Menu dialog */}
      <Dialog open={showMenu} onOpenChange={setShowMenu}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Menu</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Button variant="outline" onClick={handleShowHistory} className="w-full">
              View Order History
            </Button>
            <Button variant="outline" onClick={handleLogout} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* History dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order History</DialogTitle>
            <DialogDescription>Recently completed orders</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {orderHistory.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No order history</p>
            ) : (
              orderHistory.map((order) => (
                <Card key={order.id}>
                  <CardContent className="py-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600">{order.username}</p>
                        <p className="text-sm text-gray-600">{order.location}</p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {order.status}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
