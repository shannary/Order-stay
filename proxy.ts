/**
 * Proxy (pengganti middleware di Next.js 16).
 * Mengamankan seluruh rute /admin/* (kecuali /admin/login):
 * hanya user terautentikasi (Supabase Auth session cookie) yang diperbolehkan.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PATTERN = /^\/admin(?!.*\/login$).*$/; // /admin/* kecuali /admin/login

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          for (const { name, value } of cookies) {
            response.cookies.set(name, value, {
              httpOnly: false, // Auth cookie milik @supabase/ssr
              sameSite: "lax",
              path: "/",
            });
          }
        },
      },
    }
  );

  // getUser() memverifikasi token ke server Auth, bukan sekadar
  // membaca isi cookie → aman dari cookie yang dipalsukan.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (PROTECTED_PATTERN.test(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
