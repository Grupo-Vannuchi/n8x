import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ClientForm } from "@/components/admin/client-form";
import { emptyClientForm } from "@/lib/client-form";
import { resolveLocale } from "@/i18n/routing";

export default async function NewClientPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("admin.clients");

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
        <h1 className="text-2xl font-bold tracking-tight">{t("new")}</h1>
      </div>

      <ClientForm mode="create" defaultValues={emptyClientForm()} />
    </div>
  );
}
