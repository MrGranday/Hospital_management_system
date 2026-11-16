import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { parseSessionClaims } from "@/lib/auth/claims";
import { getPublicEnv } from "@/lib/env";

const PUBLIC_PATHS = new Set(["/login"]);

function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  for (const cookie of from.cookies.getAll()) to.cookies.set(cookie);
  return to;
}

function redirectTo(request: NextRequest, response: NextResponse, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return copyCookies(response, NextResponse.redirect(url));
}

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const env = getPublicEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = parseSessionClaims(claimsData?.claims);

  const { pathname } = request.nextUrl;

  if (!claims) {
    return PUBLIC_PATHS.has(pathname) ? response : redirectTo(request, response, "/login");
  }

  const { mustChangePassword } = claims;

  if (mustChangePassword && pathname !== "/change-password") {
    return redirectTo(request, response, "/change-password");
  }

  const isSuperAdmin = claims.role === "super_admin";
  const isPlatformPath = pathname === "/platform" || pathname.startsWith("/platform/");

  if (!mustChangePassword && isSuperAdmin && !isPlatformPath && pathname !== "/change-password") {
    return redirectTo(request, response, "/platform");
  }

  if (!isSuperAdmin && isPlatformPath) {
    return redirectTo(request, response, "/");
  }

  if (!mustChangePassword && (pathname === "/login" || pathname === "/change-password")) {
    return redirectTo(request, response, isSuperAdmin ? "/platform" : "/");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
