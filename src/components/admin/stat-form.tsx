"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";
import { Link, useRouter } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";
import { formToInput, type StatFormValues } from "@/lib/stat-form";
import {
  createStat,
  updateStat,
  type StatActionResult,
} from "@/app/actions/stats";

/** Display name for a locale tab/label (e.g. "PT", "EN"). */
const localeLabel = (locale: string) => locale.toUpperCase();

export function StatForm({
  mode,
  statId,
  defaultValues,
}: {
  mode: "create" | "edit";
  statId?: string;
  defaultValues: StatFormValues;
}) {
  const t = useTranslations("admin.stats");
  const tv = useTranslations("validation");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StatFormValues>({ defaultValues });

  async function onSubmit(values: StatFormValues) {
    setServerError(null);
    const input = formToInput(values);
    const result: StatActionResult =
      mode === "edit" && statId
        ? await updateStat(statId, input)
        : await createStat(input);

    if (result.ok) {
      router.push("/admin/stats");
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
            <Label htmlFor="key">{t("key")}</Label>
            <Input
              id="key"
              placeholder="happy-clients"
              aria-invalid={Boolean(errors.key)}
              {...register("key", required)}
            />
            <FieldError>{errors.key?.message}</FieldError>
            <p className="mt-1 text-xs text-muted-foreground">{t("keyHint")}</p>
          </div>
          <div>
            <Label htmlFor="value">{t("value")}</Label>
            <Input
              id="value"
              type="number"
              inputMode="numeric"
              aria-invalid={Boolean(errors.value)}
              {...register("value", required)}
            />
            <FieldError>{errors.value?.message}</FieldError>
            <p className="mt-1 text-xs text-muted-foreground">{t("valueHint")}</p>
          </div>
          <div>
            <Label htmlFor="suffix">{t("suffix")}</Label>
            <Input id="suffix" placeholder="+" {...register("suffix")} />
            <p className="mt-1 text-xs text-muted-foreground">{t("suffixHint")}</p>
          </div>
          <div>
            <Label htmlFor="order">{t("order")}</Label>
            <Input id="order" type="number" inputMode="numeric" {...register("order")} />
            <p className="mt-1 text-xs text-muted-foreground">{t("orderHint")}</p>
          </div>
        </div>
      </fieldset>

      {/* Bilingual content, one block per locale */}
      {locales.map((locale) => (
        <fieldset key={locale} className="rounded-xl border border-border bg-card p-5">
          <legend className="px-1 text-sm font-semibold">
            {t("sectionContent", { locale: localeLabel(locale) })}
          </legend>
          <div>
            <Label htmlFor={`label-${locale}`}>{t("labelField")}</Label>
            <Input
              id={`label-${locale}`}
              aria-invalid={Boolean(errors.label?.[locale])}
              {...register(`label.${locale}` as const, locale === locales[0] ? required : {})}
            />
            <FieldError>{errors.label?.[locale]?.message}</FieldError>
          </div>
        </fieldset>
      ))}

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
          href="/admin/stats"
          className="inline-flex h-13 items-center px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("cancel")}
        </Link>
      </div>
    </form>
  );
}
