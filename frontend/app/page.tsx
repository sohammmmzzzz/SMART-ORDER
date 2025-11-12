"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on role
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
        default:
          router.push("/login")
      }
    } else {
      router.push("/login")
    }
  }, [isAuthenticated, user, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-xl">Loading...</div>
    </div>
  )
}
