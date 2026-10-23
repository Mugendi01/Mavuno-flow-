import { NextResponse, NextRequest } from "next/server";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/transactions",
  "/sales",
  "/expenses",
  "/receivables",
  "/enterprises",
  "/reports",
  "/settings",
  "/feed",
  "/production",
  "/livestock",
];

function parseSession(cookieValue: string | undefined) {
  if (!cookieValue) return null;
  try {
    const parts = cookieValue.split(".");
    if (parts.length !== 2) return null;
    const base64 = parts[0].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = atob(base64);
    const payload = JSON.parse(jsonStr);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("farmpulse_session")?.value;
  const session = parseSession(sessionCookie);

  const isAuthenticated = !!session && !!session.userId;
  const isOnboardingComplete = session?.onboardingCompleted === true;

  // 1. Unauthenticated requests to protected pages
  const isProtectedPath = PROTECTED_ROUTES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isAuthenticated) {
    if (isProtectedPath || pathname === "/onboarding") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Allow public routes: /, /login, /register, /verify, etc.
    return NextResponse.next();
  }

  // 2. Authenticated user visiting /login or /register
  if (pathname === "/login" || pathname === "/register") {
    if (isOnboardingComplete) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  // 3. Authenticated user visiting /onboarding
  if (pathname === "/onboarding") {
    if (isOnboardingComplete) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // 4. Authenticated user visiting protected dashboard routes with incomplete onboarding
  if (isProtectedPath && !isOnboardingComplete) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/*)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, manifest.json, sw.js
     * - public icons (/icons/*)
     * - public verification (/verify/*)
     * - receipts (/receipts/*)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|verify|receipts).*)",
  ],
};
