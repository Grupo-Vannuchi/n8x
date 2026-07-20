"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Link, useRouter } from "@/i18n/navigation";
import { formToInput, type ClientFormValues } from "@/lib/client-form";
import {
  createClient,
  updateClient,
  type ClientActionResult,
} from "@/app/actions/clients";

export function ClientForm({
  mode,
  clientId,
  defaultValues,
}: {
  mode: "create" | "edit";
  clientId?: string;
  defaultValues: ClientFormValues;
}) {
  const t = useTranslations("admin.clients");
  const tv = useTranslations("validation");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({ defaultValues });

  async function onSubmit(values: ClientFormValues) {
    setServerError(null);
    const input = formToInput(values);
    const result: ClientActionResult =
      mode === "edit" && clientId
        ? await updateClient(clientId, input)
        : await createClient(input);

    if (result.ok) {
      router.push("/admin/clients");
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
              id="logoUrl"
              label={t("logoUrl")}
              hint={t("logoUrlHint")}
              preset="logo"
              value={watch("logoUrl") ?? ""}
              onChange={(v) =>
                setValue("logoUrl", v, { shouldDirty: true, shouldValidate: true })
              }
            />
            <FieldError>{errors.logoUrl?.message}</FieldError>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="website">{t("website")}</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://…"
              aria-invalid={Boolean(errors.website)}
              {...register("website")}
            />
            <FieldError>{errors.website?.message}</FieldError>
            <p className="mt-1 text-xs text-muted-foreground">{t("websiteHint")}</p>
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
          href="/admin/clients"
          className="inline-flex h-13 items-center px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("cancel")}
        </Link>
      </div>
    </form>
  );
}
