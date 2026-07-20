"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Link, useRouter } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";
import { formToInput, type TeamFormValues } from "@/lib/team-form";
import {
  createTeamMember,
  updateTeamMember,
  type TeamActionResult,
} from "@/app/actions/team";

const localeLabel = (locale: string) => locale.toUpperCase();

export function TeamForm({
  mode,
  memberId,
  defaultValues,
}: {
  mode: "create" | "edit";
  memberId?: string;
  defaultValues: TeamFormValues;
}) {
  const t = useTranslations("admin.team");
  const tv = useTranslations("validation");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TeamFormValues>({ defaultValues });

  async function onSubmit(values: TeamFormValues) {
    setServerError(null);
    const input = formToInput(values);
    const result: TeamActionResult =
      mode === "edit" && memberId
        ? await updateTeamMember(memberId, input)
        : await createTeamMember(input);

    if (result.ok) {
      router.push("/admin/team");
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
            <Label htmlFor="name">{t("name")}</Label>
            <Input
              id="name"
              aria-invalid={Boolean(errors.name)}
              {...register("name", required)}
            />
            <FieldError>{errors.name?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="order">{t("order")}</Label>
            <Input id="order" type="number" inputMode="numeric" {...register("order")} />
            <p className="mt-1 text-xs text-muted-foreground">{t("orderHint")}</p>
          </div>
          <div className="sm:col-span-2">
            <ImageUploadField
              id="photoUrl"
              label={t("photoUrl")}
              hint={t("photoUrlHint")}
              preset="photo"
              value={watch("photoUrl") ?? ""}
              onChange={(v) => setValue("photoUrl", v, { shouldDirty: true })}
            />
            <FieldError>{errors.photoUrl?.message}</FieldError>
          </div>
        </div>
      </fieldset>

      {/* Bilingual role, one block per locale */}
      {locales.map((locale) => (
        <fieldset key={locale} className="rounded-xl border border-border bg-card p-5">
          <legend className="px-1 text-sm font-semibold">
            {t("sectionContent", { locale: localeLabel(locale) })}
          </legend>
          <div>
            <Label htmlFor={`role-${locale}`}>{t("role")}</Label>
            <Input
              id={`role-${locale}`}
              aria-invalid={Boolean(errors.role?.[locale])}
              {...register(`role.${locale}` as const, locale === locales[0] ? required : {})}
            />
            <FieldError>{errors.role?.[locale]?.message}</FieldError>
          </div>
        </fieldset>
      ))}

      {/* Socials */}
      <fieldset className="rounded-xl border border-border bg-card p-5">
        <legend className="px-1 text-sm font-semibold">{t("sectionSocials")}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="instagram">{t("instagram")}</Label>
            <Input
              id="instagram"
              type="url"
              placeholder="https://instagram.com/…"
              aria-invalid={Boolean(errors.instagram)}
              {...register("instagram")}
            />
            <FieldError>{errors.instagram?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="linkedin">{t("linkedin")}</Label>
            <Input
              id="linkedin"
              type="url"
              placeholder="https://linkedin.com/in/…"
              aria-invalid={Boolean(errors.linkedin)}
              {...register("linkedin")}
            />
            <FieldError>{errors.linkedin?.message}</FieldError>
          </div>
        </div>
      </fieldset>

      {/* Flags */}
      <fieldset className="rounded-xl border border-border bg-card p-5">
        <legend className="px-1 text-sm font-semibold">{t("sectionVisibility")}</legend>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" className="size-4 accent-brand" {...register("published")} />
          {t("published")}
        </label>
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
          href="/admin/team"
          className="inline-flex h-13 items-center px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("cancel")}
        </Link>
      </div>
    </form>
  );
}
