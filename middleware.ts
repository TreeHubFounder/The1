
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Rate limiting store (in production, use Redis or external service)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function rateLimit(ip: string, limit: number = 100, windowMs: number = 15 * 60 * 1000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const current = rateLimitStore.get(ip);
  
  if (!current || current.resetTime < windowStart) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  
  if (current.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  
  current.count++;
  return { allowed: true, remaining: limit - current.count };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const ip = request.ip || 'unknown';
    const { allowed, remaining } = rateLimit(ip);
    
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Date.now().toString(),
          }
        }
      );
    }
    
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    return response;
  }
  
  // Protected routes that require authentication
  const protectedPaths = [
    '/dashboard',
    '/admin',
    '/market-conquest',
    '/jobs/create',
    '/equipment/create',
  ];
  
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  if (isProtectedPath) {
    const token = await getToken({ req: request });
    
    if (!token) {
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(signInUrl);
    }
  }
  
  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    const token = await getToken({ req: request });
    
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // Add security headers
  const response = NextResponse.next();
  
  // Security headers for production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://apps.abacus.ai https://api.openweathermap.org;"
    );
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
};
