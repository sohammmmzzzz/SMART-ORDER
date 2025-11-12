import axios, { AxiosInstance } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Handle 401 errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth
  async login(username: string, password: string) {
    const response = await this.client.post('/auth/login', { username, password })
    return response.data
  }

  async register(username: string, password: string, role: string) {
    const response = await this.client.post('/auth/register', { username, password, role })
    return response.data
  }

  async verifyToken() {
    const response = await this.client.get('/auth/verify-token')
    return response.data
  }

  async logout() {
    const response = await this.client.post('/auth/logout')
    return response.data
  }

  // Menu
  async getMenuItems() {
    const response = await this.client.get('/menu/items')
    return response.data
  }

  async getCategories() {
    const response = await this.client.get('/menu/categories')
    return response.data
  }

  // Orders
  async createOrder(items: any[], location: string) {
    const response = await this.client.post('/orders/create', { items, location })
    return response.data
  }

  async getOrders() {
    const response = await this.client.get('/orders/')
    return response.data
  }

  async getPendingOrders() {
    const response = await this.client.get('/orders/pending')
    return response.data
  }

  async updateOrderStatus(orderId: string, status: string) {
    const response = await this.client.put(`/orders/${orderId}/status`, { status })
    return response.data
  }

  async getOrderHistory(limit = 100, offset = 0) {
    const response = await this.client.get(`/orders/history?limit=${limit}&offset=${offset}`)
    return response.data
  }

  // Admin
  async getAnalytics(startDate?: string, endDate?: string) {
    let url = '/admin/analytics'
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    if (params.toString()) url += `?${params.toString()}`

    const response = await this.client.get(url)
    return response.data
  }

  async getAllOrders(filters?: any) {
    const params = new URLSearchParams()
    if (filters?.location) params.append('location', filters.location)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    const url = `/admin/orders/all${params.toString() ? `?${params.toString()}` : ''}`
    const response = await this.client.get(url)
    return response.data
  }

  async getAllUsers() {
    const response = await this.client.get('/admin/users')
    return response.data
  }

  async getStatsSummary() {
    const response = await this.client.get('/admin/stats/summary')
    return response.data
  }
}

export const api = new ApiClient()
