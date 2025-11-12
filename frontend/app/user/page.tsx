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
import { useOrderStore } from "@/store/orderStore"
import { api } from "@/lib/api"
import { Settings, ShoppingCart, LogOut, Clock, CheckCircle } from "lucide-react"
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

  const menuRef = useRef<HTMLDivElement>(null)

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

    // Animate menu items
    setTimeout(() => {
      if (menuRef.current) {
        anime({
          targets: menuRef.current.querySelectorAll(".menu-card"),
          opacity: [0, 1],
          translateY: [20, 0],
          delay: anime.stagger(50),
          duration: 400,
          easing: "easeOutExpo",
        })
      }
    }, 100)
  }

  const handleAddItem = (item: MenuItem) => {
    addItem({
      item_id: item.id,
      name: item.name,
      category: item.category,
      quantity: 1,
    })

    // Animate the card
    anime({
      targets: `[data-item-id="${item.id}"]`,
      scale: [1, 1.05, 1],
      duration: 300,
      easing: "easeInOutQuad",
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Smart Pantry</h1>
              <p className="text-sm text-gray-600">
                Welcome, {user?.username} | {location || "No location selected"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowLocationModal(true)}
                title="Change location"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleLogout} title="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order summary */}
        {getTotalItems() > 0 && (
          <div className="mb-6 animate-fade-in">
            <Card className="bg-purple-100 border-purple-300">
              <CardContent className="py-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">
                      {getTotalItems()} item(s) selected
                    </span>
                  </div>
                  <Button onClick={handleOrderClick} className="animate-glow">
                    Place Order
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedItems.map((item) => (
                    <div
                      key={item.item_id}
                      className="bg-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      <span>
                        {item.name} x{item.quantity}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(item.item_id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Menu by category */}
        <div ref={menuRef} className="space-y-8">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">{category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {menuItems
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <Card
                      key={item.id}
                      className="menu-card card-hover cursor-pointer opacity-0"
                      data-item-id={item.id}
                      onClick={() => handleAddItem(item)}
                    >
                      <CardHeader className="p-0">
                        {item.image_url && (
                          <div className="relative h-48 w-full">
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              fill
                              className="object-cover rounded-t-lg"
                            />
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-sm text-gray-600">{item.category}</p>
                        <Button className="w-full mt-2" size="sm">
                          Add to Order
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Location selection modal */}
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Location</DialogTitle>
            <DialogDescription>
              Choose your conference room location
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2">
            {LOCATIONS.map((loc) => (
              <Button
                key={loc}
                variant={location === loc ? "default" : "outline"}
                onClick={() => handleLocationSelect(loc)}
                className="w-full"
              >
                {loc}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Order confirmation modal */}
      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {orderStatus === "confirming" && "Confirm Order"}
              {orderStatus === "preparing" && "Order Preparing"}
              {orderStatus === "completed" && "Order Ready!"}
            </DialogTitle>
          </DialogHeader>

          {orderStatus === "confirming" && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-6xl font-bold text-purple-600 animate-pulse">
                  {countdown}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Order will be placed in {countdown} seconds
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={cancelOrder}
                className="w-full animate-glow"
              >
                Cancel Order
              </Button>
            </div>
          )}

          {orderStatus === "preparing" && (
            <div className="space-y-4 text-center">
              <Clock className="h-16 w-16 mx-auto text-blue-600 animate-pulse" />
              <div>
                <p className="text-2xl font-bold">{formatTime(preparationTime)}</p>
                <p className="text-sm text-gray-600">Estimated preparation time</p>
              </div>
              <p className="text-sm text-gray-500">
                Your order is being prepared. You'll be notified when it's ready!
              </p>
            </div>
          )}

          {orderStatus === "completed" && (
            <div className="space-y-4 text-center">
              <CheckCircle className="h-16 w-16 mx-auto text-green-600" />
              <div>
                <p className="text-xl font-bold">Order Ready!</p>
                <p className="text-sm text-gray-600">
                  Your order is ready for pickup at {location}
                </p>
              </div>
              <Button onClick={() => setShowOrderModal(false)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
