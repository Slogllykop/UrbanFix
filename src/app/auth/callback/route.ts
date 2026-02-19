import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getRequestOrigin(request: Request): string {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host") || requestUrl.host;
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto || requestUrl.protocol.replace(":", "");
  return `${protocol}://${host}`;
}

function isLocalOrPrivateHost(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return true;
  }

  if (hostname.startsWith("10.") || hostname.startsWith("192.168.")) {
    return true;
  }

  return /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
}

function getTrustedRedirectOrigin(
  requestOrigin: string,
  sourceOrigin: string | null,
): string {
  if (!sourceOrigin) {
    return requestOrigin;
  }

  try {
    const requestOriginUrl = new URL(requestOrigin);
    const sourceOriginUrl = new URL(sourceOrigin);
    const isHttp =
      sourceOriginUrl.protocol === "http:" ||
      sourceOriginUrl.protocol === "https:";
    const isSameHost = sourceOriginUrl.host === requestOriginUrl.host;
    const isTrustedLocal = isLocalOrPrivateHost(sourceOriginUrl.hostname);

    if (isHttp && (isSameHost || isTrustedLocal)) {
      return `${sourceOriginUrl.protocol}//${sourceOriginUrl.host}`;
    }
  } catch {
    // Fall back to request origin
  }

  return requestOrigin;
}

function getSafeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/")) return "/";
  return next;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestOrigin = getRequestOrigin(request);
  const redirectOrigin = getTrustedRedirectOrigin(
    requestOrigin,
    searchParams.get("source_origin"),
  );
  const code = searchParams.get("code");
  const next = getSafeNextPath(searchParams.get("next"));
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      `${redirectOrigin}/login?error=${encodeURIComponent(errorDescription || error)}`,
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Code exchange error:", exchangeError);
      return NextResponse.redirect(
        `${redirectOrigin}/login?error=${encodeURIComponent(exchangeError.message)}`,
      );
    }

    // Check if this is an NGO user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      // If NGO, redirect to dashboard instead
      // Type assertion needed due to Supabase type inference limitations
      const role = (userData as { role?: string } | null)?.role;
      if (role === "ngo") {
        return NextResponse.redirect(`${redirectOrigin}/dashboard`);
      }
    }

    return NextResponse.redirect(`${redirectOrigin}${next}`);
  }

  // No code present, redirect to login
  return NextResponse.redirect(`${redirectOrigin}/login?error=no_code`);
}
