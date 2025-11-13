"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useAuthStore } from "@/store/authStore"
import { api } from "@/lib/api"
import { Coffee, Loader2 } from "lucide-react"

// Animated background images
const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&q=80", // Coffee shop
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1920&q=80", // Coffee cup
  "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1920&q=80", // Coffee beans
]

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [bgIndex, setBgIndex] = useState(0)
  const router = useRouter()
  const { login, isAuthenticated, user } = useAuthStore()

  // Change background every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role) {
        case "user":
          router.push("/user")
          break
        case "pantry":
          router.push("/pantry")
          break
        case "admin":
          router.push("/admin")
          break
      }
    }
  }, [isAuthenticated, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await api.login(username, password)
      login(
        {
          id: response.user_id,
          username: response.username,
          role: response.role,
        },
        response.access_token
      )
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      {/* Animated Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={bgIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('${BACKGROUND_IMAGES[bgIndex]}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </AnimatePresence>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/70 via-blue-900/60 to-pink-900/70 z-10" />

      {/* Floating Particles */}
      <div className="absolute inset-0 z-10">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              x: [null, Math.random() * window.innerWidth],
            }}
            transition={{
              duration: Math.random() * 10 + 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-20"
      >
        <Card className="bg-white/95 backdrop-blur-lg border border-white/20 shadow-2xl p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-900 mb-4">
              <Coffee className="w-6 h-6 text-white" />
            </div>

            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              Smart Pantry
            </h1>

            <p className="text-sm text-gray-600">
              Sign in to your account
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                className="bg-white border-gray-300 text-gray-900 focus:border-gray-900 focus:ring-gray-900"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-white border-gray-300 text-gray-900 focus:border-gray-900 focus:ring-gray-900"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Test Accounts Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-700 mb-2">Test Accounts:</p>
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Admin:</span>
                <span className="font-mono">admin / password123</span>
              </div>
              <div className="flex justify-between">
                <span>Pantry:</span>
                <span className="font-mono">pantry1 / password123</span>
              </div>
              <div className="flex justify-between">
                <span>User:</span>
                <span className="font-mono">user1 / password123</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
