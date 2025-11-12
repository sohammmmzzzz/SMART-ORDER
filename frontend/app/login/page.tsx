"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import anime from "animejs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/store/authStore"
import { api } from "@/lib/api"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { login, isAuthenticated, user } = useAuthStore()
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Redirect if already authenticated
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

  useEffect(() => {
    // Animate card on mount
    if (cardRef.current) {
      anime({
        targets: cardRef.current,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 400,
        easing: "easeOutExpo",
      })
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await api.login(username, password)

      // Store auth data
      login(
        {
          id: response.user_id,
          username: response.username,
          role: response.role,
        },
        response.access_token
      )

      // Animate out
      anime({
        targets: cardRef.current,
        opacity: [1, 0],
        translateY: [0, -20],
        duration: 300,
        easing: "easeInExpo",
        complete: () => {
          // Redirect based on role
          switch (response.role) {
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
        },
      })
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed. Please try again.")
      setIsLoading(false)

      // Shake animation on error
      anime({
        targets: cardRef.current,
        translateX: [
          { value: -10, duration: 100 },
          { value: 10, duration: 100 },
          { value: -10, duration: 100 },
          { value: 10, duration: 100 },
          { value: 0, duration: 100 },
        ],
        easing: "easeInOutSine",
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        {/* Animated gradient overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&h=900&fit=crop')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </div>

      {/* Login card */}
      <Card ref={cardRef} className="w-full max-w-md z-10 shadow-2xl opacity-0">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">
            Smart Pantry
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
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
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
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
              />
            </div>

            {error && (
              <div className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-xs text-center text-muted-foreground">
            <p>Test accounts:</p>
            <p>admin/password123 | pantry1/password123 | user1/password123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
