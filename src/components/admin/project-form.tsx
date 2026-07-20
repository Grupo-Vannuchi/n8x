"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, FieldError } from "@/components/ui/field";
import {
  ImageUploadField,
  GalleryUploadField,
} from "@/components/admin/image-upload-field";
import { Link, useRouter } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";
import {
  formToInput,
  type ProjectFormValues,
} from "@/lib/project-form";
import {
  createProject,
  updateProject,
  type ProjectActionResult,
} from "@/app/actions/projects";

/** Display name for a locale tab/label (e.g. "PT", "EN"). */
const localeLabel = (locale: string) => locale.toUpperCase();

export function ProjectForm({
  mode,
  projectId,
  defaultValues,
}: {
  mode: "create" | "edit";
  projectId?: string;
  defaultValues: ProjectFormValues;
}) {
  const t = useTranslations("admin.projects");
  const tv = useTranslations("validation");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({ defaultValues });

  async function onSubmit(values: ProjectFormValues) {
    setServerError(null);
    const input = formToInput(values);
    const result: ProjectActionResult =
      mode === "edit" && projectId
        ? await updateProject(projectId, input)
        : await createProject(input);

    if (result.ok) {
      router.push("/admin/projects");
      router.refresh();
    } else {
      setServerError(t(`error.${result.error}`));
    }
  }

  const required = { required: tv("required") };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8" noValidate>
      {/* Basics */}
      <fieldset className="rounded-xl border border-border bg-card p-5">
        <legend className="px-1 text-sm font-semibold">{t("sectionBasics")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="slug">{t("slug")}</Label>
            <Input
              id="slug"
              placeholder="sabor-urbano"
              aria-invalid={Boolean(errors.slug)}
              {...register("slug", required)}
            />
            <FieldError>{errors.slug?.message}</FieldError>
            <p className="mt-1 text-xs text-muted-foreground">{t("slugHint")}</p>
          </div>
          <div>
            <Label htmlFor="clientName">{t("clientName")}</Label>
            <Input
              id="clientName"
              aria-invalid={Boolean(errors.clientName)}
              {...register("clientName", required)}
            />
            <FieldError>{errors.clientName?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="year">{t("year")}</Label>
            <Input
              id="year"
              type="number"
              inputMode="numeric"
              aria-invalid={Boolean(errors.year)}
              {...register("year", required)}
            />
            <FieldError>{errors.year?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="order">{t("order")}</Label>
            <Input id="order" type="number" inputMode="numeric" {...register("order")} />
            <p className="mt-1 text-xs text-muted-foreground">{t("orderHint")}</p>
          </div>
        </div>
      </fieldset>

      {/* Media */}
      <fieldset className="rounded-xl border border-border bg-card p-5">
        <legend className="px-1 text-sm font-semibold">{t("sectionMedia")}</legend>
        <div className="flex flex-col gap-4">
          <div>
            <ImageUploadField
              id="coverImage"
              label={t("coverImage")}
              preset="cover"
              value={watch("coverImage") ?? ""}
              onChange={(v) =>
                setValue("coverImage", v, { shouldDirty: true, shouldValidate: true })
              }
            />
            <FieldError>{errors.coverImage?.message}</FieldError>
          </div>
          <div>
            <GalleryUploadField
              label={t("gallery")}
              hint={t("galleryHint")}
              value={watch("gallery") ?? ""}
              onChange={(v) => setValue("gallery", v, { shouldDirty: true })}
            />
          </div>
          <div>
            <Label htmlFor="tags">{t("tags")}</Label>
            <Input id="tags" placeholder="Branding, Social Media" {...register("tags")} />
            <p className="mt-1 text-xs text-muted-foreground">{t("tagsHint")}</p>
          </div>
        </div>
      </fieldset>

      {/* Bilingual content, one block per locale */}
      {locales.map((locale) => (
        <fieldset key={locale} className="rounded-xl border border-border bg-card p-5">
          <legend className="px-1 text-sm font-semibold">
            {t("sectionContent", { locale: localeLabel(locale) })}
          </legend>
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor={`title-${locale}`}>{t("titleField")}</Label>
                <Input
                  id={`title-${locale}`}
                  aria-invalid={Boolean(errors.title?.[locale])}
                  {...register(`title.${locale}` as const, locale === locales[0] ? required : {})}
                />
                <FieldError>{errors.title?.[locale]?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor={`category-${locale}`}>{t("category")}</Label>
                <Input
                  id={`category-${locale}`}
                  aria-invalid={Boolean(errors.category?.[locale])}
                  {...register(`category.${locale}` as const, locale === locales[0] ? required : {})}
                />
                <FieldError>{errors.category?.[locale]?.message}</FieldError>
              </div>
            </div>
            <div>
              <Label htmlFor={`summary-${locale}`}>{t("summary")}</Label>
              <Input
                id={`summary-${locale}`}
                aria-invalid={Boolean(errors.summary?.[locale])}
                {...register(`summary.${locale}` as const, locale === locales[0] ? required : {})}
              />
              <FieldError>{errors.summary?.[locale]?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor={`content-${locale}`}>{t("content")}</Label>
              <Textarea
                id={`content-${locale}`}
                className="min-h-40"
                {...register(`content.${locale}` as const, locale === locales[0] ? required : {})}
              />
              <p className="mt-1 text-xs text-muted-foreground">{t("contentHint")}</p>
              <FieldError>{errors.content?.[locale]?.message}</FieldError>
            </div>
          </div>
        </fieldset>
      ))}

      {/* Flags */}
      <fieldset className="rounded-xl border border-border bg-card p-5">
        <legend className="px-1 text-sm font-semibold">{t("sectionVisibility")}</legend>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" className="size-4 accent-brand" {...register("published")} />
            {t("published")}
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" className="size-4 accent-brand" {...register("featured")} />
            {t("featured")}
          </label>
        </div>
      </fieldset>

      {serverError ? (
        <p role="alert" className="text-sm text-red-500">
          {serverError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? t("saving") : mode === "create" ? t("create") : t("save")}
        </Button>
        <Link
          href="/admin/projects"
          className="inline-flex h-13 items-center px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("cancel")}
        </Link>
      </div>
    </form>
  );
}
