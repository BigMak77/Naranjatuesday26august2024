import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// For now, we'll keep middleware simple and rely on component-level protection
// Route-level protection will be handled by RequireAccess components in each page

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  
  // Allow all routes to pass through - protection is handled at component level
  // This allows for better user experience with proper error messages
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
