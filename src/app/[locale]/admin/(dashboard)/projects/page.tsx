import { getTranslations, setRequestLocale } from "next-intl/server";
import { Plus, Pencil, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { ProjectDeleteButton } from "@/components/admin/project-delete-button";
import { getAdminProjects } from "@/lib/admin-queries";
import { localize } from "@/lib/content";
import { resolveLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export default async function AdminProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("admin.projects");
  const projects = await getAdminProjects();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <Link href="/admin/projects/new" className={buttonVariants({ size: "md" })}>
          <Plus className="size-4" />
          {t("new")}
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {projects.map((project) => (
            <li
              key={project.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">
                    {localize(project.title, locale)}
                  </span>
                  {project.featured ? (
                    <Star className="size-4 fill-accent text-accent" aria-label={t("featured")} />
                  ) : null}
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      project.published
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {project.published ? t("statusPublished") : t("statusDraft")}
                  </span>
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {project.clientName} · {project.year} · /{project.slug}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="size-4" />
                  {t("edit")}
                </Link>
                <ProjectDeleteButton
                  id={project.id}
                  title={localize(project.title, locale)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
