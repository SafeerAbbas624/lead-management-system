"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export function RedirectAfterLogin() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      console.log('RedirectAfterLogin: User is authenticated, redirecting to dashboard')
      // Use replace instead of push to avoid back button issues
      router.replace('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Checking authentication...</div>
  }

  if (user) {
    return <div>Redirecting to dashboard...</div>
  }

  return null
}
