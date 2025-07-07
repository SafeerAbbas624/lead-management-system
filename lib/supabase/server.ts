import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type CookieMethods = {
  get: (name: string) => string | undefined
  set: (name: string, value: string, options: CookieOptions) => void
  remove: (name: string, options: CookieOptions) => void
}

export function createServerClient() {
  const cookieStore = cookies()
  
  const cookieMethods: CookieMethods = {
    get(name: string) {
      return cookieStore.get(name)?.value
    },
    set(name: string, value: string, options: CookieOptions) {
      try {
        const response = new NextResponse()
        response.cookies.set({
          name,
          value,
          ...options,
          sameSite: 'lax',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
        })
        // The cookie will be set via the response headers
      } catch (error) {
        console.error('Error setting cookie:', error)
      }
    },
    remove(name: string, options: CookieOptions) {
      try {
        const response = new NextResponse()
        response.cookies.set({
          name,
          value: '',
          ...options,
          maxAge: 0,
          sameSite: 'lax',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
        })
        // The cookie will be removed via the response headers
      } catch (error) {
        console.error('Error removing cookie:', error)
      }
    },
  }
  
  return createSupabaseServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: cookieMethods,
    }
  )
}
