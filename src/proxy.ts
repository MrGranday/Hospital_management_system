import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user) {
    return PUBLIC_PATHS.has(pathname) ? response : redirectTo(request, response, "/login");
  }

  const mustChangePassword = user.app_metadata.must_change_password === true;

  if (mustChangePassword && pathname !== "/change-password") {
    return redirectTo(request, response, "/change-password");
  }

  const role = typeof user.app_metadata.role === "string" ? user.app_metadata.role : "";
  const isSuperAdmin = role === "super_admin";
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
