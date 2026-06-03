import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EDITOR";
};

/**
 * Data Access Layer entry point. Verifies the session cookie and confirms the
 * user still exists in the database. Cached per request so multiple components
 * (layout, page) share one lookup. Returns null when unauthenticated.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.adminUser.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true },
  });
  return user;
});

/**
 * Guard for admin pages. Redirects to the (locale-aware) login route when the
 * request is not authenticated; otherwise returns the user.
 */
export async function requireAdmin(locale: Locale): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user) return user;
  redirect({ href: "/admin/login", locale });
  throw new Error("unreachable: redirect halts execution");
}
