"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/store/authStore"
import { api } from "@/lib/api"
import {
  LogOut,
  TrendingUp,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Users,
  BarChart3,
  PieChart as PieChartIcon,
  Coffee,
  Sparkles,
  Filter,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { formatDate } from "@/lib/utils"

interface Analytics {
  stats: {
    total_orders: number
    pending_orders: number
    completed_orders: number
    cancelled_orders: number
  }
  location_distribution: Array<{ location: string; order_count: number }>
  hourly_distribution: Array<{ hour: number; order_count: number }>
  avg_completion_time_minutes: number | null
}

interface Order {
  id: string
  user_id: string
  username?: string
  items: any[]
  location: string
  status: string
  created_at: string
  completed_at?: string
}

const COLORS = ["#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#3b82f6"]

// Office/analytics themed Unsplash backgrounds
const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80", // Analytics dashboard
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=80", // Charts and graphs
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80", // Office workspace
]

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [locationFilter, setLocationFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [bgIndex, setBgIndex] = useState(0)

  // Change background every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/login")
      return
    }

    fetchData()

    // Poll every 10 minutes
    const interval = setInterval(fetchData, 600000)
    return () => clearInterval(interval)
  }, [isAuthenticated, user, router])

  const fetchData = async () => {
    try {
      const [analyticsData, ordersData, usersData] = await Promise.all([
        api.getAnalytics(),
        api.getAllOrders(),
        api.getAllUsers(),
      ])

      setAnalytics(analyticsData)
      setOrders(ordersData)
      setUsers(usersData)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching data:", error)
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const filteredOrders = orders.filter((order) => {
    if (locationFilter && order.location !== locationFilter) return false
    if (statusFilter && order.status !== statusFilter) return false
    return true
  })

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {/* Background */}
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-900/90 via-purple-900/80 to-pink-900/90 z-0" />

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
            <BarChart3 className="w-16 h-16 text-white mx-auto mb-4" />
          </motion.div>
          <motion.p
            className="text-xl text-white font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading dashboard...
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
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-900/85 via-purple-900/75 to-pink-900/85 z-10" />

      {/* Floating Particles */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        {[...Array(10)].map((_, i) => (
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
              duration: Math.random() * 20 + 15,
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
              <BarChart3 className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-sm text-white/80 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Welcome, {user?.username}
                </p>
              </div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="glass border-white/20 text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Total Orders",
              value: analytics?.stats.total_orders || 0,
              icon: Package,
              color: "from-purple-500 to-purple-600",
              delay: 0,
            },
            {
              title: "Pending",
              value: analytics?.stats.pending_orders || 0,
              icon: Clock,
              color: "from-yellow-500 to-yellow-600",
              delay: 0.1,
            },
            {
              title: "Completed",
              value: analytics?.stats.completed_orders || 0,
              icon: CheckCircle,
              color: "from-green-500 to-green-600",
              delay: 0.2,
            },
            {
              title: "Total Users",
              value: users.length,
              icon: Users,
              color: "from-blue-500 to-blue-600",
              delay: 0.3,
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: stat.delay }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <Card className="glass border-white/20 shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                  <CardTitle className="text-sm font-medium text-white/90">
                    {stat.title}
                  </CardTitle>
                  <motion.div
                    className={`bg-gradient-to-br ${stat.color} p-2 rounded-lg`}
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <stat.icon className="h-4 w-4 text-white" />
                  </motion.div>
                </CardHeader>
                <CardContent className="relative">
                  <motion.div
                    className="text-3xl font-bold text-white"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: stat.delay + 0.2 }}
                  >
                    {stat.value}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Average completion time */}
        {analytics?.avg_completion_time_minutes && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass border-white/20 shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
              <CardHeader className="relative">
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Average Completion Time
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <motion.div
                  className="text-4xl font-bold gradient-text"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  {Math.round(analytics.avg_completion_time_minutes)} minutes
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Location distribution */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="glass border-white/20 shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
              <CardHeader className="relative">
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Orders by Location
                </CardTitle>
                <CardDescription className="text-white/70">
                  Distribution across conference rooms
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.location_distribution || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="location"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      stroke="rgba(255,255,255,0.8)"
                    />
                    <YAxis stroke="rgba(255,255,255,0.8)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                        color: "white",
                      }}
                    />
                    <Bar dataKey="order_count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Hourly distribution */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <Card className="glass border-white/20 shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
              <CardHeader className="relative">
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Orders by Hour
                </CardTitle>
                <CardDescription className="text-white/70">
                  Peak ordering times
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.hourly_distribution || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="hour" stroke="rgba(255,255,255,0.8)" />
                    <YAxis stroke="rgba(255,255,255,0.8)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                        color: "white",
                      }}
                    />
                    <Bar dataKey="order_count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Order status pie chart */}
        {analytics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Card className="glass border-white/20 shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
              <CardHeader className="relative">
                <CardTitle className="text-white flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  Order Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Pending", value: analytics.stats.pending_orders },
                        { name: "Completed", value: analytics.stats.completed_orders },
                        { name: "Cancelled", value: analytics.stats.cancelled_orders },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#f59e0b" />
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                        color: "white",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Order history table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <Card className="glass border-white/20 shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            <CardHeader className="relative">
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order History
              </CardTitle>
              <CardDescription className="text-white/70">
                Complete order management
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              {/* Filters */}
              <motion.div
                className="flex gap-4 mb-4 flex-wrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="glass border border-white/20 rounded-lg px-4 py-2 text-white bg-white/10 focus:bg-white/20 transition-all"
                >
                  <option value="" className="bg-gray-900">All Locations</option>
                  <option value="Conference 1" className="bg-gray-900">Conference 1</option>
                  <option value="Conference 2" className="bg-gray-900">Conference 2</option>
                  <option value="Conference 3" className="bg-gray-900">Conference 3</option>
                  <option value="Conference 4" className="bg-gray-900">Conference 4</option>
                  <option value="Main Conference" className="bg-gray-900">Main Conference</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="glass border border-white/20 rounded-lg px-4 py-2 text-white bg-white/10 focus:bg-white/20 transition-all"
                >
                  <option value="" className="bg-gray-900">All Statuses</option>
                  <option value="pending" className="bg-gray-900">Pending</option>
                  <option value="preparing" className="bg-gray-900">Preparing</option>
                  <option value="completed" className="bg-gray-900">Completed</option>
                  <option value="cancelled" className="bg-gray-900">Cancelled</option>
                </select>

                {(locationFilter || statusFilter) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      onClick={() => {
                        setLocationFilter("")
                        setStatusFilter("")
                      }}
                      className="glass border-white/20 text-white hover:bg-white/20"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  </motion.div>
                )}
              </motion.div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-4 text-white/90 font-semibold">Order ID</th>
                      <th className="text-left py-3 px-4 text-white/90 font-semibold">User</th>
                      <th className="text-left py-3 px-4 text-white/90 font-semibold">Location</th>
                      <th className="text-left py-3 px-4 text-white/90 font-semibold">Items</th>
                      <th className="text-left py-3 px-4 text-white/90 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 text-white/90 font-semibold">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-white/70">
                            No orders found
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.slice(0, 50).map((order, index) => (
                          <motion.tr
                            key={order.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                            whileHover={{ backgroundColor: "rgba(255,255,255,0.1)", scale: 1.01 }}
                            className="border-b border-white/10"
                          >
                            <td className="py-3 px-4 text-sm text-white/90">
                              {order.id.slice(0, 8)}...
                            </td>
                            <td className="py-3 px-4 text-sm text-white/90">{order.username}</td>
                            <td className="py-3 px-4 text-sm text-white/90">{order.location}</td>
                            <td className="py-3 px-4 text-sm text-white/90">
                              {order.items.length} item(s)
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  order.status === "completed"
                                    ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                    : order.status === "pending"
                                    ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                                    : order.status === "cancelled"
                                    ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                    : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                }`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-white/90">
                              {formatDate(order.created_at)}
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {filteredOrders.length > 50 && (
                <motion.p
                  className="text-sm text-white/70 mt-4 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Showing 50 of {filteredOrders.length} orders
                </motion.p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
