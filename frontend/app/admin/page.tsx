"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"]

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.username}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.stats.total_orders || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {analytics?.stats.pending_orders || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {analytics?.stats.completed_orders || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Average completion time */}
        {analytics?.avg_completion_time_minutes && (
          <Card>
            <CardHeader>
              <CardTitle>Average Completion Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {Math.round(analytics.avg_completion_time_minutes)} minutes
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Location distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Orders by Location</CardTitle>
              <CardDescription>Distribution across conference rooms</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.location_distribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="order_count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Hourly distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Orders by Hour</CardTitle>
              <CardDescription>Peak ordering times</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.hourly_distribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="order_count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Order status pie chart */}
        {analytics && (
          <Card>
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
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
                    <Cell fill="#f59e0b" />
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Order history table */}
        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
            <CardDescription>Complete order management</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-4 mb-4">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="border rounded-md px-3 py-2"
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
                className="border rounded-md px-3 py-2"
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
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Order ID</th>
                    <th className="text-left py-2 px-4">User</th>
                    <th className="text-left py-2 px-4">Location</th>
                    <th className="text-left py-2 px-4">Items</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Created</th>
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
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">
                          {order.id.slice(0, 8)}...
                        </td>
                        <td className="py-3 px-4 text-sm">{order.username}</td>
                        <td className="py-3 px-4 text-sm">{order.location}</td>
                        <td className="py-3 px-4 text-sm">
                          {order.items.length} item(s)
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : order.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : order.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredOrders.length > 50 && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                Showing 50 of {filteredOrders.length} orders
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
