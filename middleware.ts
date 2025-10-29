import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Get the pathname of the request (e.g. /, /protected)
    const { pathname } = req.nextUrl;

    // Check if user is authenticated
    const token = req.nextauth.token;

    // Define protected routes
    const protectedRoutes = [
      "/design",
      "/plans",
      "/credits",
      "/dashboard",
      "/profile",
      "/files",
      "/review",
    ];

    // Check if the current path is a protected route
    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    // If it's a protected route and user is not authenticated, redirect to auth
    if (isProtectedRoute && !token) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    // If user is authenticated and trying to access auth page, redirect to dashboard
    if (token && pathname === "/auth") {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Define protected routes
        const protectedRoutes = [
          "/design",
          "/plans",
          "/credits",
          "/dashboard",
          "/profile",
          "/files",
          "/review",
        ];

        // Check if the current path is a protected route
        const isProtectedRoute = protectedRoutes.some((route) =>
          pathname.startsWith(route)
        );

        // Allow access to public routes
        if (!isProtectedRoute) {
          return true;
        }

        // For protected routes, require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
