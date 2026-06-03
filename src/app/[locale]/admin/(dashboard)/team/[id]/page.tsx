import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { TeamForm } from "@/components/admin/team-form";
import { getTeamMemberById } from "@/lib/admin-queries";
import { teamMemberToForm } from "@/lib/team-form";
import { resolveLocale } from "@/i18n/routing";

export default async function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("admin.team");

  const member = await getTeamMemberById(id);
  if (!member) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <Link
          href="/admin/team"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("title")}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("editTitle", { name: member.name })}
        </h1>
      </div>

      <TeamForm
        mode="edit"
        memberId={member.id}
        defaultValues={teamMemberToForm(member)}
      />
    </div>
  );
}
