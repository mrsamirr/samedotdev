import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export const useAuth = (redirectTo?: string) => {
  const { data: session, status } = useSession()
  const router = useRouter()

  const isLoading = status === "loading"
  const isAuthenticated = !!session?.user

  useEffect(() => {
    if (!isLoading && !isAuthenticated && redirectTo) {
      router.push(redirectTo)
    }
  }, [isLoading, isAuthenticated, redirectTo, router])

  return {
    session,
    user: session?.user,
    isLoading,
    isAuthenticated,
  }
}

export const useRequireAuth = () => {
  return useAuth("/auth")
}