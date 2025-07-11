import { createBrowserClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Helper to check if code is running on the client
const isBrowser = typeof window !== 'undefined'

export function createClient() {
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          // Only run on client-side
          if (!isBrowser) return undefined
          
          // Get cookie from document.cookie
          const value = `; ${document.cookie}`
          const parts = value.split(`; ${name}=`)
          if (parts.length === 2) return parts.pop()?.split(';').shift()
          return undefined
        },
        set(name: string, value: string, options: CookieOptions) {
          if (!isBrowser) return
          
          let cookieString = `${name}=${value}; Path=/; ${options?.httpOnly ? 'HttpOnly;' : ''} Secure; SameSite=Lax`
          
          if (options?.maxAge) {
            cookieString += `; Max-Age=${options.maxAge}`
          }
          
          if (options?.expires) {
            cookieString += `; Expires=${options.expires.toUTCString()}`
          }
          
          document.cookie = cookieString
        },
        remove(name: string, options: CookieOptions) {
          if (!isBrowser) return
          document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${options?.httpOnly ? 'HttpOnly;' : ''} Secure; SameSite=Lax`
        },
      },
    }
  )
}

// Create a single supabase client for interacting with your database
export const supabase = createClient()
