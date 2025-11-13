"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useAuthStore } from "@/store/authStore"
import { api } from "@/lib/api"
import { Coffee, Loader2, Sparkles, ChevronRight } from "lucide-react"

// Animated background images
const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&q=80",
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1920&q=80",
  "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1920&q=80",
]

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [bgIndex, setBgIndex] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const router = useRouter()
  const { login, isAuthenticated, user } = useAuthStore()

  // Track mouse for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

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
          transition={{ duration: 2, ease: "easeInOut" }}
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('${BACKGROUND_IMAGES[bgIndex]}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </AnimatePresence>

      {/* Aurora Gradient Overlay */}
      <div className="absolute inset-0 z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/40 via-pink-500/30 to-blue-600/40 animate-pulse"
          style={{ animationDuration: '8s' }} />
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-600/30 via-purple-500/40 to-pink-600/30 animate-pulse"
          style={{ animationDuration: '6s', animationDelay: '1s' }} />
      </div>

      {/* Animated Mesh Grid */}
      <div className="absolute inset-0 z-10 opacity-20">
        <div className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Large Floating Particles */}
      <div className="absolute inset-0 z-10">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 400 + 100,
              height: Math.random() * 400 + 100,
              background: `radial-gradient(circle, ${
                ['rgba(167, 139, 250, 0.15)', 'rgba(236, 72, 153, 0.15)', 'rgba(59, 130, 246, 0.15)'][i % 3]
              } 0%, transparent 70%)`,
              filter: 'blur(40px)',
            }}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: [null, Math.random() * window.innerWidth],
              y: [null, Math.random() * window.innerHeight],
            }}
            transition={{
              duration: Math.random() * 20 + 15,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Glowing Orbs */}
      <div className="absolute inset-0 z-10 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(167, 139, 250, 0.3) 0%, transparent 70%)',
            filter: 'blur(60px)',
            top: '10%',
            left: '10%',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
            filter: 'blur(60px)',
            bottom: '10%',
            right: '10%',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      {/* Login Card with Parallax */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: mousePosition.y * 0.1,
          rotateY: mousePosition.x * 0.1,
        }}
        transition={{
          duration: 0.8,
          type: "spring",
          stiffness: 100,
        }}
        className="w-full max-w-md relative z-20"
        style={{ perspective: '1000px' }}
      >
        <Card className="relative overflow-hidden border-white/20 shadow-2xl backdrop-blur-xl bg-white/10"
          style={{
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), 0 0 80px rgba(167, 139, 250, 0.2)',
          }}
        >
          {/* Shimmer Effect */}
          <motion.div
            className="absolute inset-0 z-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
            }}
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          <div className="relative z-10 p-8">
            {/* Logo with Glow */}
            <motion.div
              className="text-center mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <motion.div
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 mb-4 relative"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  boxShadow: '0 0 40px rgba(167, 139, 250, 0.6), 0 0 80px rgba(236, 72, 153, 0.4)',
                }}
              >
                <Coffee className="w-10 h-10 text-white" />
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400"
                  animate={{
                    opacity: [0, 0.5, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
              </motion.div>

              <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200">
                Smart Pantry
              </h1>
              <p className="text-white/80 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI-Powered Food Ordering
                <Sparkles className="w-4 h-4" />
              </p>
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 backdrop-blur-sm"
                >
                  <p className="text-sm text-red-200 text-center font-medium">{error}</p>
                </motion.div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Username
                  </label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/20 focus:border-purple-400/50 transition-all duration-300"
                    style={{
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                    }}
                    placeholder="Enter your username"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/20 focus:border-purple-400/50 transition-all duration-300"
                    style={{
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                    }}
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-500 hover:via-pink-500 hover:to-blue-500 text-white font-semibold py-6 rounded-xl shadow-lg transition-all duration-300 relative overflow-hidden group"
                  style={{
                    boxShadow: '0 4px 20px rgba(167, 139, 250, 0.4)',
                  }}
                >
                  {/* Button Shine Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />

                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </Button>
              </motion.div>

              <p className="text-center text-sm text-white/60 mt-4">
                Demo: user1 / password123
              </p>
            </form>
          </div>
        </Card>

        {/* Card Glow Effect */}
        <div
          className="absolute inset-0 rounded-xl -z-10"
          style={{
            background: 'radial-gradient(circle at center, rgba(167, 139, 250, 0.3) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </motion.div>

      {/* Bottom Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 z-10 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  )
}
