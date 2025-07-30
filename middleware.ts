import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a new response object to handle cookies
  const cookieStore = await cookies()
  
  // Create a Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
            sameSite: 'lax',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
        },
      },
    }
  )

  try {
    console.log('Middleware processing:', request.nextUrl.pathname)

    // For our custom auth, check the auth-token cookie instead of Supabase session
    const authToken = request.cookies.get('auth-token')?.value
    console.log('Auth token exists:', !!authToken)

    // If user is not signed in and the current path is not /login, redirect to /login
    if (!authToken && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/api')) {
      console.log('No auth token, redirecting to login')
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is signed in and the current path is /login, redirect to /dashboard
    if (authToken && request.nextUrl.pathname === '/login') {
      console.log('User has auth token but on login page, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    console.log('Middleware allowing request to continue')
    return response
  } catch (error) {
    console.error('Error in middleware:', error)
    // If there's an error, allow the request to continue but log it
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
