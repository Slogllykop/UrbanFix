import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database";

// Route protection configuration
const PUBLIC_ROUTES = ["/login", "/ngo-login", "/auth/callback"];
const USER_ONLY_ROUTES = ["/report"];
const NGO_ONLY_ROUTES = ["/dashboard"];
const PROTECTED_ROUTES = ["/", "/issue", "/profile"];
const MOBILE_ONLY_UPLOAD_ROUTE = "/report";
const MOBILE_REQUIRED_QUERY = "mobile_required";
const MOBILE_UA_REGEX =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;

function isMobileUserAgent(userAgent: string): boolean {
  return MOBILE_UA_REGEX.test(userAgent);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({
            request,
          });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const hasOAuthParams =
    request.nextUrl.searchParams.has("code") ||
    request.nextUrl.searchParams.has("error");

  // OAuth can return to base origin (/) when redirect allowlists are host-only.
  // Rewrite it to /auth/callback so we can exchange code server-side without
  // introducing an extra absolute redirect hop that may normalize to localhost.
  if (hasOAuthParams && pathname !== "/auth/callback") {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    return NextResponse.rewrite(callbackUrl);
  }

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  // If public route, allow access
  if (isPublicRoute) {
    // If user is logged in and trying to access login pages, redirect to home
    if (user && (pathname === "/login" || pathname === "/ngo-login")) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Check if route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const isUserOnlyRoute = USER_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const isNgoOnlyRoute = NGO_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  // If no user and trying to access protected route, redirect to login
  if (!user && (isProtectedRoute || isUserOnlyRoute || isNgoOnlyRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // If user exists, check role-based access
  if (user) {
    // Fetch user role from database
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    // Type assertion needed due to Supabase type inference limitations
    const userRole = (userData as { role?: string } | null)?.role || "user";

    // NGO-only routes: only ngo and admin can access
    if (isNgoOnlyRoute && userRole !== "ngo" && userRole !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // User-only routes: ngo cannot access (they shouldn't report issues)
    if (isUserOnlyRoute && userRole === "ngo") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  const isMobileOnlyUploadRoute =
    pathname === MOBILE_ONLY_UPLOAD_ROUTE ||
    pathname.startsWith(`${MOBILE_ONLY_UPLOAD_ROUTE}/`);

  if (isMobileOnlyUploadRoute) {
    const url = request.nextUrl.clone();
    const userAgent = request.headers.get("user-agent") || "";
    const isMobile = isMobileUserAgent(userAgent);
    const hasMobileRequiredFlag =
      request.nextUrl.searchParams.get(MOBILE_REQUIRED_QUERY) === "1";

    // Non-mobile users are redirected with a flag so the page can show
    // the existing "Mobile Device Required" warning state.
    if (!isMobile && !hasMobileRequiredFlag) {
      url.searchParams.set(MOBILE_REQUIRED_QUERY, "1");
      return NextResponse.redirect(url);
    }

    // Clean up the query when a mobile user hits the same URL.
    if (isMobile && hasMobileRequiredFlag) {
      url.searchParams.delete(MOBILE_REQUIRED_QUERY);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
