import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// The secret key should ideally be in environment variables
// For example: process.env.SECRET_PASSCODE
const SECRET_PASSCODE = process.env.SECRET_PASSCODE || 'buka_sesame_123';
const COOKIE_NAME = 'app_auth_token';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const kunci = url.searchParams.get('kunci');
  
  // 1. Check if the user is trying to authenticate with the secret URL parameter
  if (kunci === SECRET_PASSCODE) {
    // Create a response that redirects to the homepage (removing the URL param)
    const response = NextResponse.redirect(new URL('/', request.url));
    
    // Set the magic cookie. 
    // Secure flag is true for production (HTTPS), httpOnly prevents JS access
    response.cookies.set(COOKIE_NAME, SECRET_PASSCODE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years (effectively permanent)
    });
    
    return response;
  }

  // 2. For all other requests, verify the cookie
  const authToken = request.cookies.get(COOKIE_NAME)?.value;
  
  if (authToken !== SECRET_PASSCODE) {
    // If not authenticated, return a stealthy 404 Not Found
    // This hides the fact that an app even exists here
    return new NextResponse('Not Found', { status: 404 });
  }

  // 3. If authenticated, allow the request to proceed
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (like images in public dir)
     * - manifest.json (for PWA)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
};
