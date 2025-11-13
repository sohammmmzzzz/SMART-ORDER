"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useAuthStore } from "@/store/authStore"
import { api } from "@/lib/api"
import { Coffee, Sparkles, Loader2 } from "lucide-react"

// Animated background images from Unsplash
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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Animated Background with Parallax */}
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
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              x: [null, Math.random() * window.innerWidth],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Login Card with Glass Morphism */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.8,
          ease: [0.6, -0.05, 0.01, 0.99],
        }}
        className="relative z-20 w-full max-w-md px-4"
      >
        <Card className="glass border-white/20 shadow-2xl overflow-hidden">
          {/* Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

          <div className="relative p-8">
            {/* Logo and Title */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <motion.div
                className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-primary mb-4 shadow-lg"
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Coffee className="w-10 h-10 text-white" />
              </motion.div>

              <h1 className="text-4xl font-bold text-white mb-2">
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Smart Pantry
                </motion.span>
              </h1>

              <motion.p
                className="text-white/80 text-sm flex items-center justify-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Sparkles className="w-4 h-4" />
                Order with ease, delivered with care
                <Sparkles className="w-4 h-4" />
              </motion.p>
            </motion.div>

            {/* Login Form */}
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-white/90">
                  Username
                </label>
                <motion.div
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:bg-white/15 transition-all"
                  />
                </motion.div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-white/90">
                  Password
                </label>
                <motion.div
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:bg-white/15 transition-all"
                  />
                </motion.div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-red-300 text-center bg-red-500/20 p-3 rounded-lg border border-red-500/30"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  className="w-full gradient-primary text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all ripple relative overflow-hidden"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <motion.span
                        className="ml-2"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.form>

            {/* Test Accounts Info */}
            <motion.div
              className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-xs text-white/70 text-center mb-2 font-medium">Test Accounts:</p>
              <div className="text-xs text-white/60 space-y-1">
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
            </motion.div>
          </div>
        </Card>

        {/* Floating Badge */}
        <motion.div
          className="absolute -top-4 -right-4 glass p-3 rounded-full shadow-lg"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Sparkles className="w-6 h-6 text-yellow-300" />
        </motion.div>
      </motion.div>

      {/* Bottom Wave Effect */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <svg
          viewBox="0 0 1440 320"
          className="w-full"
          preserveAspectRatio="none"
        >
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            fill="rgba(255,255,255,0.05)"
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>
    </div>
  )
}
