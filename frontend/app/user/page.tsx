"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
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
import { useOrderStore } from "@/store/orderStore"
import { api } from "@/lib/api"
import { Settings, ShoppingCart, LogOut, Clock, CheckCircle, MapPin, Coffee } from "lucide-react"
import Image from "next/image"

interface MenuItem {
  id: string
  category: string
  name: string
  available: boolean
  image_url?: string
}

const LOCATIONS = [
  "Conference 1",
  "Conference 2",
  "Conference 3",
  "Conference 4",
  "Main Conference",
]

// Background images for user dashboard
const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1920&q=80", // Food spread
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80", // Gourmet food
  "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=1920&q=80", // Breakfast spread
]

export default function UserDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const {
    selectedItems,
    location,
    setLocation,
    addItem,
    removeItem,
    clearOrder,
    getTotalItems,
  } = useOrderStore()

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [isOrdering, setIsOrdering] = useState(false)
  const [orderStatus, setOrderStatus] = useState<"idle" | "confirming" | "preparing" | "completed">("idle")
  const [preparationTime, setPreparationTime] = useState(900)
  const [bgIndex, setBgIndex] = useState(0)

  // Change background every 7 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length)
    }, 7000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "user") {
      router.push("/login")
      return
    }

    if (!location) {
      setShowLocationModal(true)
    }

    fetchMenuItems()
  }, [isAuthenticated, user, location, router])

  const fetchMenuItems = async () => {
    try {
      const data = await api.getMenuItems()
      setMenuItems(data.items)
      setCategories(data.categories)
    } catch (error) {
      console.error("Error fetching menu items:", error)
    }
  }

  const handleLocationSelect = (loc: string) => {
    setLocation(loc)
    setShowLocationModal(false)
  }

  const handleAddItem = (item: MenuItem) => {
    addItem({
      item_id: item.id,
      name: item.name,
      category: item.category,
      quantity: 1,
    })
  }

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId)
  }

  const handleOrderClick = () => {
    if (selectedItems.length === 0) return
    setShowOrderModal(true)
    setCountdown(5)
    setOrderStatus("confirming")
  }

  useEffect(() => {
    if (showOrderModal && orderStatus === "confirming" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (showOrderModal && orderStatus === "confirming" && countdown === 0) {
      confirmOrder()
    }
  }, [showOrderModal, orderStatus, countdown])

  useEffect(() => {
    if (orderStatus === "preparing" && preparationTime > 0) {
      const timer = setTimeout(() => setPreparationTime(preparationTime - 1), 1000)
      return () => clearTimeout(timer)
    } else if (orderStatus === "preparing" && preparationTime === 0) {
      setOrderStatus("completed")
    }
  }, [orderStatus, preparationTime])

  const confirmOrder = async () => {
    setIsOrdering(true)
    try {
      await api.createOrder(selectedItems, location!)
      setOrderStatus("preparing")
      setPreparationTime(900)
      clearOrder()
    } catch (error) {
      console.error("Error creating order:", error)
      alert("Failed to place order. Please try again.")
      setShowOrderModal(false)
      setOrderStatus("idle")
    } finally {
      setIsOrdering(false)
    }
  }

  const cancelOrder = () => {
    setShowOrderModal(false)
    setOrderStatus("idle")
    setCountdown(5)
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
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
      <div className="fixed inset-0 bg-gradient-to-br from-orange-900/60 via-amber-900/50 to-yellow-900/60 z-10" />

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
                <h1 className="text-lg font-semibold text-gray-900">Smart Pantry</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {location && (
                <div className="px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700 font-medium">{location}</span>
                </div>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowLocationModal(true)}
                className="border-gray-300 hover:bg-gray-50"
                title="Change location"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
                className="border-gray-300 hover:bg-gray-50"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order summary */}
        <AnimatePresence>
          {getTotalItems() > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mb-6 sticky top-4 z-30"
            >
              <Card className="bg-white/95 backdrop-blur-lg border border-white/20 shadow-2xl">
                <CardContent className="py-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-gray-700" />
                      <span className="font-medium text-gray-900">
                        {getTotalItems()} item(s) in cart
                      </span>
                    </div>
                    <Button
                      onClick={handleOrderClick}
                      className="bg-gray-900 hover:bg-gray-800 text-white font-medium"
                    >
                      Place Order
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                      {selectedItems.map((item) => (
                        <motion.div
                          key={item.item_id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-gray-200"
                        >
                          <span className="text-gray-700 font-medium">
                            {item.name} x{item.quantity}
                          </span>
                          <button
                            onClick={() => handleRemoveItem(item.item_id)}
                            className="text-gray-500 hover:text-gray-700 font-bold"
                          >
                            ×
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Menu by category */}
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category}>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{category}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {menuItems
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        className="bg-white/95 backdrop-blur-sm border border-white/20 cursor-pointer hover:border-white/40 hover:shadow-2xl transition-all"
                        onClick={() => handleAddItem(item)}
                      >
                        {item.image_url ? (
                          <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-48 w-full bg-gray-100 flex items-center justify-center rounded-t-lg">
                            <Coffee className="w-12 h-12 text-gray-400" />
                          </div>
                        )}

                        <CardContent className="p-4">
                          <h3 className="font-medium text-gray-900 mb-1">{item.name}</h3>
                          <p className="text-sm text-gray-600 mb-3">{item.category}</p>
                          <Button
                            className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                            size="sm"
                          >
                            Add to Cart
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Location selection modal */}
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900 text-xl flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Select Location
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Choose your conference room location
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 mt-4">
            {LOCATIONS.map((loc) => (
              <Button
                key={loc}
                variant={location === loc ? "default" : "outline"}
                onClick={() => handleLocationSelect(loc)}
                className={
                  location === loc
                    ? "bg-gray-900 hover:bg-gray-800 text-white"
                    : "border-gray-300 hover:bg-gray-50"
                }
              >
                {loc}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Order confirmation modal */}
      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 text-xl">
              {orderStatus === "confirming" && "Confirm Order"}
              {orderStatus === "preparing" && "Order Preparing"}
              {orderStatus === "completed" && "Order Ready!"}
            </DialogTitle>
          </DialogHeader>

          {orderStatus === "confirming" && (
            <div className="space-y-6 py-4">
              <div className="text-center">
                <div className="text-6xl font-bold text-gray-900">
                  {countdown}
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Order will be placed in {countdown} seconds
                </p>
              </div>
              <Button
                variant="outline"
                onClick={cancelOrder}
                className="w-full border-red-300 text-red-600 hover:bg-red-50"
              >
                Cancel Order
              </Button>
            </div>
          )}

          {orderStatus === "preparing" && (
            <div className="space-y-6 py-4 text-center">
              <Clock className="h-16 w-16 mx-auto text-gray-400" />
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {formatTime(preparationTime)}
                </p>
                <p className="text-sm text-gray-600 mt-2">Estimated preparation time</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700">
                  Your order is being prepared. You'll be notified when it's ready!
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-full bg-gray-900 rounded-full transition-all duration-500"
                  style={{ width: `${((900 - preparationTime) / 900) * 100}%` }}
                />
              </div>
            </div>
          )}

          {orderStatus === "completed" && (
            <div className="space-y-6 py-4 text-center">
              <CheckCircle className="h-16 w-16 mx-auto text-green-600" />
              <div>
                <p className="text-xl font-semibold text-gray-900 mb-2">Order Ready!</p>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 inline-block">
                  <p className="text-sm text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Pickup at {location}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowOrderModal(false)}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
