import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { consentUrl, isGoogleConfigured } from "@/lib/google-calendar";

/**
 * Start the Google OAuth consent flow. Admin-only (the proxy excludes /api, so
 * auth is enforced here). Redirects the browser to Google's consent screen.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isGoogleConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 400 });
  }
  return NextResponse.redirect(consentUrl());
}
