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

export async function createServerClient() {
  const cookieStore = await cookies()
  
  const cookieMethods: CookieMethods = {
    get(name: string) {
      try {
        const cookie = cookieStore.get(name)
        return cookie?.value
      } catch (error) {
        console.error('Error getting cookie:', error)
        return undefined
      }
    },
    async set(name: string, value: string, options: CookieOptions) {
      try {
        // In Next.js 15+, we set cookies via the response
        const response = new NextResponse()
        response.cookies.set({
          name,
          value,
          ...options,
          sameSite: 'lax',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
        })
        // The cookie is set via the response headers
        return Promise.resolve()
      } catch (error) {
        console.error('Error setting cookie:', error)
        return Promise.resolve()
      }
    },
    async remove(name: string, options: CookieOptions) {
      try {
        // In Next.js 15+, we set cookies via the response
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
        // The cookie is set via the response headers
        return Promise.resolve()
      } catch (error) {
        console.error('Error removing cookie:', error)
        return Promise.resolve()
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
