import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ClientForm } from "@/components/admin/client-form";
import { getClientById } from "@/lib/admin-queries";
import { clientToForm } from "@/lib/client-form";
import { resolveLocale } from "@/i18n/routing";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("admin.clients");

  const client = await getClientById(id);
  if (!client) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <Link
          href="/admin/clients"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("title")}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("editTitle", { name: client.name })}
        </h1>
      </div>

      <ClientForm
        mode="edit"
        clientId={client.id}
        defaultValues={clientToForm(client)}
      />
    </div>
  );
}
