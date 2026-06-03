"use server";

import bcrypt from "bcryptjs";
import { hasLocale } from "next-intl";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { loginSchema } from "@/lib/validations/auth";
import { redirect } from "@/i18n/navigation";
import { defaultLocale, routing } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";

export type LoginState = { error: boolean };

function localeFrom(formData: FormData): Locale {
  const value = String(formData.get("locale") ?? "");
  return hasLocale(routing.locales, value) ? value : defaultLocale;
}

/**
 * Authenticates an admin user (react `useActionState` signature). On success it
 * creates the session and redirects to the dashboard; on failure it returns a
 * generic error (no user enumeration).
 */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const locale = localeFrom(formData);

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: true };

  const user = await prisma.adminUser.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user) return { error: true };

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return { error: true };

  await createSession({ userId: user.id, role: user.role });
  redirect({ href: "/admin", locale });
  throw new Error("unreachable: redirect halts execution");
}

/** Clears the session and returns to the login screen. */
export async function logout(locale: Locale): Promise<void> {
  await deleteSession();
  redirect({ href: "/admin/login", locale });
}
