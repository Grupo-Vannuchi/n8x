import { getTranslations, setRequestLocale } from "next-intl/server";
import { Plus, Pencil } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { ClientDeleteButton } from "@/components/admin/client-delete-button";
import { getAdminClients } from "@/lib/admin-queries";
import { resolveLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export default async function AdminClientsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("admin.clients");
  const clients = await getAdminClients();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <Link href="/admin/clients/new" className={buttonVariants({ size: "md" })}>
          <Plus className="size-4" />
          {t("new")}
        </Link>
      </div>

      {clients.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {clients.map((client) => (
            <li
              key={client.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                  {/* Admin-supplied logos may be hosted anywhere, so use a plain
                      <img> rather than next/image (which needs whitelisted hosts). */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={client.logoUrl}
                    alt={client.name}
                    className="h-full w-full object-contain"
                  />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{client.name}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        client.published
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {client.published ? t("statusPublished") : t("statusDraft")}
                    </span>
                  </div>
                  {client.website ? (
                    <p className="truncate text-sm text-muted-foreground">
                      {client.website}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href={`/admin/clients/${client.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="size-4" />
                  {t("edit")}
                </Link>
                <ClientDeleteButton id={client.id} name={client.name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
