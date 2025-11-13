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
  CheckCircle2,
  History,
  Coffee,
  Sparkles,
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

// Kitchen/pantry themed Unsplash backgrounds
const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80", // Kitchen
  "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1920&q=80", // Modern kitchen
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80", // Organized pantry
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
  const [dragDirection, setDragDirection] = useState<"left" | "right" | null>(null)

  // Change background every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

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

      // Remove from list
      setOrders((prev) => prev.filter((_, idx) => idx !== currentIndex))
      setCurrentIndex((prev) => Math.max(0, Math.min(prev, orders.length - 2)))
    } catch (error) {
      console.error("Error completing order:", error)
      alert("Failed to complete order")
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setDragDirection("right")
      setTimeout(() => {
        setCurrentIndex((prev) => prev - 1)
        setDragDirection(null)
      }, 300)
    }
  }

  const handleNext = () => {
    if (currentIndex < orders.length - 1) {
      setDragDirection("left")
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1)
        setDragDirection(null)
      }, 300)
    }
  }

  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 100
    if (Math.abs(info.offset.x) > swipeThreshold) {
      if (info.offset.x < 0 && currentIndex < orders.length - 1) {
        handleNext()
      } else if (info.offset.x > 0 && currentIndex > 0) {
        handlePrevious()
      }
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
        {/* Background */}
        <div className="fixed inset-0 bg-gradient-to-br from-green-900/90 via-blue-900/80 to-purple-900/90 z-0" />

        {/* Loading animation */}
        <motion.div
          className="relative z-10 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Coffee className="w-16 h-16 text-white mx-auto mb-4" />
          </motion.div>
          <motion.p
            className="text-xl text-white font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading orders...
          </motion.p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={bgIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url('${BACKGROUND_IMAGES[bgIndex]}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </AnimatePresence>

      {/* Gradient Overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-green-900/85 via-blue-900/75 to-purple-900/85 z-10" />

      {/* Floating Particles */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 1000),
            }}
            animate={{
              y: [null, Math.random() * (typeof window !== "undefined" ? window.innerHeight : 1000)],
              x: [null, Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000)],
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Header with Glass Morphism */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-20 glass border-b border-white/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
            >
              <Coffee className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">Pantry Dashboard</h1>
                <p className="text-sm text-white/80 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Welcome, {user?.username}
                </p>
              </div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowMenu(!showMenu)}
                className="glass border-white/20 text-white hover:bg-white/20"
                title="Menu"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {orders.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-20"
            >
              <motion.div
                className="glass p-12 rounded-3xl border border-white/20 shadow-2xl inline-block"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                  }}
                >
                  <Package className="h-24 w-24 mx-auto text-white/70 mb-4" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-3">No Pending Orders</h2>
                <p className="text-white/80 text-lg">
                  All orders have been completed. Great job!
                </p>
                <motion.div
                  className="mt-6"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                >
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-400" />
                </motion.div>
              </motion.div>
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
              <motion.div
                className="text-center glass p-4 rounded-2xl border border-white/20 inline-block mx-auto"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-lg font-bold text-white">
                  Order {currentIndex + 1} of {orders.length}
                </p>
                {orders.length > 1 && (
                  <p className="text-sm text-white/70">
                    {orders.length - 1} more order(s) in queue
                  </p>
                )}
              </motion.div>

              {/* Order card with swipe gesture */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentOrder?.id}
                  initial={{ opacity: 0, x: dragDirection === "left" ? 100 : dragDirection === "right" ? -100 : 0, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: dragDirection === "left" ? -100 : dragDirection === "right" ? 100 : 0, scale: 0.9 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={handleDragEnd}
                  whileHover={{ scale: 1.02 }}
                  className="touch-pan-y"
                >
                  <Card className="glass border-white/20 shadow-2xl overflow-hidden">
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

                    <CardContent className="p-6 space-y-4 relative">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <motion.h2
                            className="text-2xl font-bold text-white mb-1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                          >
                            Order #{currentOrder?.id.slice(0, 8)}
                          </motion.h2>
                          <p className="text-sm text-white/70">
                            Placed {currentOrder && formatDate(currentOrder.created_at)}
                          </p>
                        </div>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="glass bg-yellow-500/20 border border-yellow-500/30 text-yellow-200 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2"
                        >
                          <motion.div
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-2 h-2 bg-yellow-400 rounded-full"
                          />
                          Pending
                        </motion.div>
                      </div>

                      {/* Customer info */}
                      <motion.div
                        className="glass p-4 rounded-xl border border-white/20 space-y-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <div className="flex items-center gap-3 text-white">
                          <User className="h-5 w-5 text-blue-300" />
                          <span className="font-medium">{currentOrder?.username || "Unknown User"}</span>
                        </div>

                        <div className="flex items-center gap-3 text-white">
                          <MapPin className="h-5 w-5 text-green-300" />
                          <span>{currentOrder?.location}</span>
                        </div>

                        <div className="flex items-center gap-3 text-white">
                          <Clock className="h-5 w-5 text-purple-300" />
                          <span>
                            {currentOrder &&
                              new Date(currentOrder.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </motion.div>

                      {/* Items */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <h3 className="font-semibold mb-3 text-lg text-white flex items-center gap-2">
                          <Package className="w-5 h-5" />
                          Order Items:
                        </h3>
                        <div className="space-y-2">
                          {currentOrder?.items.map((item: any, idx: number) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 + idx * 0.1 }}
                              className="glass p-4 rounded-xl border border-white/20 flex justify-between items-center"
                              whileHover={{ scale: 1.02, x: 5 }}
                            >
                              <div>
                                <p className="font-medium text-white">{item.name}</p>
                                <p className="text-sm text-white/70">{item.category}</p>
                              </div>
                              <motion.div
                                className="text-xl font-bold text-white bg-white/10 px-4 py-2 rounded-full"
                                whileHover={{ scale: 1.1 }}
                              >
                                x{item.quantity}
                              </motion.div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>

                      {/* Complete button */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={handleCompleteOrder}
                          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-6 text-lg ripple flex items-center justify-center gap-2"
                          size="lg"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          Mark as Complete
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              {orders.length > 1 && (
                <motion.div
                  className="flex justify-center gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentIndex === 0}
                      className="glass border-white/20 text-white hover:bg-white/20 disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      onClick={handleNext}
                      disabled={currentIndex === orders.length - 1}
                      className="glass border-white/20 text-white hover:bg-white/20 disabled:opacity-30"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Menu dialog */}
      <AnimatePresence>
        {showMenu && (
          <Dialog open={showMenu} onOpenChange={setShowMenu}>
            <DialogContent className="glass border-white/20 text-white">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <DialogHeader>
                  <DialogTitle className="text-white text-2xl">Menu</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="outline"
                      onClick={handleShowHistory}
                      className="w-full glass border-white/20 text-white hover:bg-white/20 flex items-center gap-2"
                    >
                      <History className="w-4 h-4" />
                      View Order History
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      className="w-full glass border-white/20 text-white hover:bg-white/20 flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* History dialog */}
      <AnimatePresence>
        {showHistory && (
          <Dialog open={showHistory} onOpenChange={setShowHistory}>
            <DialogContent className="glass border-white/20 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <DialogHeader>
                  <DialogTitle className="text-white text-2xl flex items-center gap-2">
                    <History className="w-6 h-6" />
                    Order History
                  </DialogTitle>
                  <DialogDescription className="text-white/70">
                    Recently completed orders
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 mt-4">
                  {orderHistory.length === 0 ? (
                    <motion.p
                      className="text-center text-white/70 py-8"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      No order history
                    </motion.p>
                  ) : (
                    <AnimatePresence>
                      {orderHistory.map((order, index) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <Card className="glass border-white/20">
                            <CardContent className="py-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-white">Order #{order.id.slice(0, 8)}</p>
                                  <p className="text-sm text-white/70">{order.username}</p>
                                  <p className="text-sm text-white/70 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {order.location}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      order.status === "completed"
                                        ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                                    }`}
                                  >
                                    {order.status}
                                  </div>
                                  <p className="text-xs text-white/60 mt-2">
                                    {formatDate(order.created_at)}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  )
}
