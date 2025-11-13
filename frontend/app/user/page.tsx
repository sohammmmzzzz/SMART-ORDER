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
import { Settings, ShoppingCart, LogOut, Clock, CheckCircle, MapPin, Sparkles, Coffee } from "lucide-react"
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

// Unsplash food/coffee backgrounds
const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1920&q=80", // Tea and coffee
  "https://images.unsplash.com/photo-1556881286-fc6915169721?w=1920&q=80", // Coffee cups
  "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1920&q=80", // Breakfast spread
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
  const [preparationTime, setPreparationTime] = useState(900) // 15 minutes in seconds
  const [bgIndex, setBgIndex] = useState(0)

  // Change background every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated || user?.role !== "user") {
      router.push("/login")
      return
    }

    // Show location modal if no location selected
    if (!location) {
      setShowLocationModal(true)
    }

    // Fetch menu items
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
      setPreparationTime(900) // Reset to 15 minutes
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
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/80 via-blue-900/70 to-pink-900/80 z-10" />

      {/* Floating Particles */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        {[...Array(15)].map((_, i) => (
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
            <div>
              <motion.div
                className="flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
              >
                <Coffee className="w-8 h-8 text-white" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Smart Pantry</h1>
                  <p className="text-sm text-white/80 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Welcome, {user?.username}
                  </p>
                </div>
              </motion.div>
            </div>
            <div className="flex items-center gap-2">
              {location && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="glass px-4 py-2 rounded-full border border-white/20 flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-white" />
                  <span className="text-sm text-white font-medium">{location}</span>
                </motion.div>
              )}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowLocationModal(true)}
                  className="glass border-white/20 text-white hover:bg-white/20"
                  title="Change location"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleLogout}
                  className="glass border-white/20 text-white hover:bg-white/20"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order summary with glass effect */}
        <AnimatePresence>
          {getTotalItems() > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="mb-6 sticky top-4 z-30"
            >
              <Card className="glass border-white/20 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                <CardContent className="py-4 relative">
                  <div className="flex justify-between items-center mb-3">
                    <motion.div
                      className="flex items-center gap-2"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <ShoppingCart className="h-5 w-5 text-white" />
                      <span className="font-medium text-white">
                        {getTotalItems()} item(s) in cart
                      </span>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={handleOrderClick}
                        className="gradient-primary text-white font-semibold shadow-lg ripple"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Place Order
                      </Button>
                    </motion.div>
                  </div>
                  <motion.div
                    className="flex flex-wrap gap-2"
                    layout
                  >
                    <AnimatePresence>
                      {selectedItems.map((item) => (
                        <motion.div
                          key={item.item_id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          layout
                          className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-white/20"
                        >
                          <span className="text-white font-medium">
                            {item.name} x{item.quantity}
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.2, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRemoveItem(item.item_id)}
                            className="text-red-300 hover:text-red-100 font-bold"
                          >
                            ×
                          </motion.button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Menu by category */}
        <div className="space-y-8">
          {categories.map((category, categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
            >
              <motion.div
                className="mb-4 glass inline-block px-6 py-3 rounded-full border border-white/20"
                whileHover={{ scale: 1.05 }}
              >
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  {category}
                </h2>
              </motion.div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {menuItems
                  .filter((item) => item.category === category)
                  .map((item, itemIndex) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: categoryIndex * 0.1 + itemIndex * 0.05,
                      }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className="glass border-white/20 cursor-pointer overflow-hidden group shadow-xl"
                        onClick={() => handleAddItem(item)}
                      >
                        {/* Shimmer effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity" />

                        {item.image_url ? (
                          <div className="relative h-48 w-full overflow-hidden">
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          </div>
                        ) : (
                          <div className="h-48 w-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                            <Coffee className="w-16 h-16 text-white/50" />
                          </div>
                        )}

                        <CardContent className="p-4 relative">
                          <h3 className="font-semibold text-lg text-white mb-1">{item.name}</h3>
                          <p className="text-sm text-white/70 mb-3">{item.category}</p>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              className="w-full gradient-primary text-white font-semibold ripple"
                              size="sm"
                            >
                              Add to Cart
                            </Button>
                          </motion.div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Location selection modal */}
      <AnimatePresence>
        {showLocationModal && (
          <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
            <DialogContent className="glass border-white/20 text-white">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <DialogHeader>
                  <DialogTitle className="text-white text-2xl flex items-center gap-2">
                    <MapPin className="w-6 h-6" />
                    Select Location
                  </DialogTitle>
                  <DialogDescription className="text-white/70">
                    Choose your conference room location
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-3 mt-4">
                  {LOCATIONS.map((loc, index) => (
                    <motion.div
                      key={loc}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant={location === loc ? "default" : "outline"}
                        onClick={() => handleLocationSelect(loc)}
                        className={
                          location === loc
                            ? "w-full gradient-primary text-white font-semibold ripple"
                            : "w-full glass border-white/20 text-white hover:bg-white/20"
                        }
                      >
                        {loc}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Order confirmation modal */}
      <AnimatePresence>
        {showOrderModal && (
          <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
            <DialogContent className="glass border-white/20 text-white sm:max-w-md">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
              >
                <DialogHeader>
                  <DialogTitle className="text-white text-2xl">
                    {orderStatus === "confirming" && "Confirm Order"}
                    {orderStatus === "preparing" && "Order Preparing"}
                    {orderStatus === "completed" && "Order Ready!"}
                  </DialogTitle>
                </DialogHeader>

                {orderStatus === "confirming" && (
                  <div className="space-y-6 py-4">
                    <div className="text-center">
                      <motion.div
                        className="text-8xl font-bold gradient-text"
                        animate={{
                          scale: [1, 1.1, 1],
                          opacity: [1, 0.8, 1],
                        }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        {countdown}
                      </motion.div>
                      <p className="text-sm text-white/80 mt-4">
                        Order will be placed in {countdown} seconds
                      </p>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="destructive"
                        onClick={cancelOrder}
                        className="w-full bg-red-500/80 hover:bg-red-600/80 text-white font-semibold py-6 ripple"
                      >
                        Cancel Order
                      </Button>
                    </motion.div>
                  </div>
                )}

                {orderStatus === "preparing" && (
                  <div className="space-y-6 py-4 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Clock className="h-20 w-20 mx-auto text-blue-400" />
                    </motion.div>
                    <div>
                      <motion.p
                        className="text-4xl font-bold text-white"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        {formatTime(preparationTime)}
                      </motion.p>
                      <p className="text-sm text-white/70 mt-2">Estimated preparation time</p>
                    </div>
                    <div className="glass p-4 rounded-lg border border-white/20">
                      <p className="text-sm text-white/80">
                        Your order is being prepared. You'll be notified when it's ready!
                      </p>
                    </div>
                    {/* Animated progress bar */}
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full gradient-primary"
                        initial={{ width: "0%" }}
                        animate={{ width: `${((900 - preparationTime) / 900) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}

                {orderStatus === "completed" && (
                  <motion.div
                    className="space-y-6 py-4 text-center"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 360],
                      }}
                      transition={{ duration: 0.6 }}
                    >
                      <CheckCircle className="h-20 w-20 mx-auto text-green-400" />
                    </motion.div>
                    <div>
                      <p className="text-2xl font-bold text-white mb-2">Order Ready!</p>
                      <div className="glass p-3 rounded-lg border border-white/20 inline-block">
                        <p className="text-sm text-white/80 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Pickup at {location}
                        </p>
                      </div>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        onClick={() => setShowOrderModal(false)}
                        className="w-full gradient-primary text-white font-semibold py-6 ripple"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Awesome!
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  )
}
