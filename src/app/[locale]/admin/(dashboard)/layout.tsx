import { setRequestLocale } from "next-intl/server";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { countFunnelSubmissions } from "@/lib/admin-queries";
import { resolveLocale } from "@/i18n/routing";

export const metadata = { robots: { index: false, follow: false } };

// Admin is always rendered per request (session + live data); never prerender.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);

  // Redirects to /admin/login when not authenticated.
  const user = await requireAdmin(locale);
  const funnelSubmissions = await countFunnelSubmissions();

  return (
    <AdminShell
      user={user}
      locale={locale}
      badges={{ funnels: funnelSubmissions }}
    >
      {children}
    </AdminShell>
  );
}
