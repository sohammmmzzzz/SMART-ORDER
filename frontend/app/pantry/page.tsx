"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, PanInfo } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuthStore } from "@/store/authStore"
import { api } from "@/lib/api"
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  MoreVertical,
  Clock,
  MapPin,
  User,
  Package,
  CheckCircle2,
  History,
  Coffee,
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

// Background images for pantry dashboard
const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1920&q=80", // Kitchen workspace
  "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=1920&q=80", // Modern kitchen
  "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1920&q=80", // Commercial kitchen
]

export default function PantryDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMenu, setShowMenu] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [orderHistory, setOrderHistory] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [bgIndex, setBgIndex] = useState(0)

  // Change background every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== "pantry" && user?.role !== "admin")) {
      router.push("/login")
      return
    }

    fetchOrders()

    // Poll every 2 seconds for near real-time updates
    const interval = setInterval(fetchOrders, 2000)
    return () => clearInterval(interval)
  }, [isAuthenticated, user, router])

  const fetchOrders = async () => {
    try {
      const data = await api.getPendingOrders()
      // Force state update by creating new array reference
      setOrders([...data])
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

      setOrders((prev) => prev.filter((_, idx) => idx !== currentIndex))
      setCurrentIndex((prev) => Math.max(0, Math.min(prev, orders.length - 2)))
    } catch (error) {
      console.error("Error completing order:", error)
      alert("Failed to complete order")
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < orders.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
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
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-teal-900/30 to-blue-900/40 z-0" />
        <div className="text-center relative z-10">
          <Coffee className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={bgIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url('${BACKGROUND_IMAGES[bgIndex]}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </AnimatePresence>

      {/* Gradient Overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-green-900/60 via-teal-900/50 to-blue-900/60 z-10" />

      {/* Content wrapper */}
      <div className="relative z-20 min-h-screen">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-lg border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                <Coffee className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Pantry Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.username}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowMenu(!showMenu)}
              className="border-gray-300 hover:bg-gray-50"
              title="Menu"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {orders.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <div className="bg-white/95 backdrop-blur-lg p-12 rounded-lg border border-white/20 shadow-2xl inline-block">
                <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Pending Orders</h2>
                <p className="text-gray-600">
                  All orders have been completed. Great job!
                </p>
                <CheckCircle2 className="h-10 w-10 mx-auto text-green-600 mt-6" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="orders"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Order counter */}
              <div className="text-center bg-white/95 backdrop-blur-lg p-4 rounded-lg border border-white/20 shadow-lg inline-block">
                <p className="text-base font-semibold text-gray-900">
                  Order {currentIndex + 1} of {orders.length}
                </p>
                {orders.length > 1 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {orders.length - 1} more order(s) in queue
                  </p>
                )}
              </div>

              {/* Order card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentOrder?.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="bg-white/95 backdrop-blur-lg border border-white/20 shadow-2xl">
                    <CardContent className="p-6 space-y-4">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 mb-1">
                            Order #{currentOrder?.id.slice(0, 8)}
                          </h2>
                          <p className="text-sm text-gray-600">
                            Placed {currentOrder && formatDate(currentOrder.created_at)}
                          </p>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                          Pending
                        </div>
                      </div>

                      {/* Customer info */}
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                        <div className="flex items-center gap-3 text-gray-700">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{currentOrder?.username || "Unknown User"}</span>
                        </div>

                        <div className="flex items-center gap-3 text-gray-700">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{currentOrder?.location}</span>
                        </div>

                        <div className="flex items-center gap-3 text-gray-700">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>
                            {currentOrder &&
                              new Date(currentOrder.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div>
                        <h3 className="font-medium mb-3 text-gray-900 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Order Items:
                        </h3>
                        <div className="space-y-2">
                          {currentOrder?.items.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center"
                            >
                              <div>
                                <p className="font-medium text-gray-900">{item.name}</p>
                                <p className="text-sm text-gray-600">{item.category}</p>
                              </div>
                              <div className="text-lg font-semibold text-gray-900 bg-gray-200 px-3 py-1 rounded-lg">
                                x{item.quantity}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Complete button */}
                      <Button
                        onClick={handleCompleteOrder}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-6 flex items-center justify-center gap-2"
                        size="lg"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Mark as Complete
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              {orders.length > 1 && (
                <div className="flex justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNext}
                    disabled={currentIndex === orders.length - 1}
                    className="border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Menu dialog */}
      <Dialog open={showMenu} onOpenChange={setShowMenu}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Menu</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            <Button
              variant="outline"
              onClick={handleShowHistory}
              className="w-full border-gray-300 hover:bg-gray-50 flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              View Order History
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full border-gray-300 hover:bg-gray-50 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* History dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="bg-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5" />
              Order History
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Recently completed orders
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {orderHistory.length === 0 ? (
              <p className="text-center text-gray-600 py-8">
                No order history
              </p>
            ) : (
              orderHistory.map((order) => (
                <Card key={order.id} className="bg-gray-50 border border-gray-200">
                  <CardContent className="py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600">{order.username}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {order.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            order.status === "completed"
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-red-100 text-red-700 border border-red-200"
                          }`}
                        >
                          {order.status}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
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
    </div>
  )
}
