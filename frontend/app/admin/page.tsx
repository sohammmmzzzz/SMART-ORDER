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
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

const COLORS = ["#f59e0b", "#10b981", "#ef4444"]

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [locationFilter, setLocationFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/login")
      return
    }

    fetchData()

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.username}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-gray-300 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Total Orders",
              value: analytics?.stats.total_orders || 0,
              icon: Package,
              color: "bg-purple-50 text-purple-600",
            },
            {
              title: "Pending",
              value: analytics?.stats.pending_orders || 0,
              icon: Clock,
              color: "bg-yellow-50 text-yellow-600",
            },
            {
              title: "Completed",
              value: analytics?.stats.completed_orders || 0,
              icon: CheckCircle,
              color: "bg-green-50 text-green-600",
            },
            {
              title: "Total Users",
              value: users.length,
              icon: Users,
              color: "bg-blue-50 text-blue-600",
            },
          ].map((stat) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Average completion time */}
        {analytics?.avg_completion_time_minutes && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Average Completion Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {Math.round(analytics.avg_completion_time_minutes)} minutes
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Location distribution */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Orders by Location
              </CardTitle>
              <CardDescription className="text-gray-600">
                Distribution across conference rooms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.location_distribution || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="location"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar dataKey="order_count" fill="#111827" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Hourly distribution */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Orders by Hour
              </CardTitle>
              <CardDescription className="text-gray-600">
                Peak ordering times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.hourly_distribution || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="hour" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar dataKey="order_count" fill="#111827" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Order status pie chart */}
        {analytics && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
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
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Order history table */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order History
            </CardTitle>
            <CardDescription className="text-gray-600">
              Complete order management
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-3 mb-4 flex-wrap">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              >
                <option value="">All Locations</option>
                <option value="Conference 1">Conference 1</option>
                <option value="Conference 2">Conference 2</option>
                <option value="Conference 3">Conference 3</option>
                <option value="Conference 4">Conference 4</option>
                <option value="Main Conference">Main Conference</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {(locationFilter || statusFilter) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setLocationFilter("")
                    setStatusFilter("")
                  }}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold text-sm">Order ID</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold text-sm">User</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold text-sm">Location</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold text-sm">Items</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold text-sm">Status</th>
                    <th className="text-left py-3 px-4 text-gray-700 font-semibold text-sm">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.slice(0, 50).map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {order.id.slice(0, 8)}...
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">{order.username}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{order.location}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {order.items.length} item(s)
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              order.status === "completed"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : order.status === "pending"
                                ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                : order.status === "cancelled"
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : "bg-blue-100 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredOrders.length > 50 && (
              <p className="text-sm text-gray-600 mt-4 text-center">
                Showing 50 of {filteredOrders.length} orders
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
