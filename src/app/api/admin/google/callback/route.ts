import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { exchangeCodeAndStore, isGoogleConfigured } from "@/lib/google-calendar";
import { env } from "@/lib/env";

/**
 * Google OAuth callback. Admin-only. Exchanges the `code` for tokens, stores the
 * single GoogleAccount, and returns to the admin Google connection page.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  const adminUrl = `${base}/admin/funnels/google`;
  const code = request.nextUrl.searchParams.get("code");

  if (!code || !isGoogleConfigured()) {
    return NextResponse.redirect(`${adminUrl}?error=1`);
  }

  try {
    await exchangeCodeAndStore(code);
    return NextResponse.redirect(`${adminUrl}?connected=1`);
  } catch (error) {
    console.error("Google OAuth callback failed", error);
    return NextResponse.redirect(`${adminUrl}?error=1`);
  }
}
