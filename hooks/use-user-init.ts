import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { createOrUpdateUser } from "@/lib/supabase"

export function useUserInit() {
  const { user, isLoaded } = useUser()
  const [isInitialized, setIsInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function initializeUser() {
      if (!isLoaded || !user || isInitialized || isInitializing) return

      setIsInitializing(true)
      setError(null)

      try {
        await createOrUpdateUser({
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress || "",
          first_name: user.firstName || undefined,
          last_name: user.lastName || undefined,
          image_url: user.imageUrl || undefined,
        })

        setIsInitialized(true)
      } catch (err) {
        console.error("Failed to initialize user:", err)
        setError(err instanceof Error ? err.message : "Failed to initialize user")
      } finally {
        setIsInitializing(false)
      }
    }

    initializeUser()
  }, [user, isLoaded, isInitialized, isInitializing])

  return {
    isInitialized,
    isInitializing,
    error,
    user
  }
} 